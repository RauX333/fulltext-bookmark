import { aliasToken, aliasMatch, canonicalQuery } from './aliases'
import { relevanceBoost } from './ranking'
import { db, type PageDatabase, INDEX_VERSION } from './database'
import { parseQuery, matchFilters } from './search-query'
import { normalize, stem, editDistance, deletions, makeSnippet } from './text'
import type { SearchRequest, SearchResponse, SearchResult } from './types'
export { parseQuery } from './search-query'
const MAX_CANDIDATES = 5000
type Field = 'titleWords' | 'contentWords' | 'urlWords'
const weights: Record<Field, number> = {
  titleWords: 5,
  contentWords: 1,
  urlWords: 2
}
export async function searchPages(
  request: SearchRequest,
  database: PageDatabase = db,
  partial = false,
  cancelled: () => boolean = () => false
): Promise<SearchResponse> {
  const started = performance.now()
  const empty = (): SearchResponse => ({
    results: [],
    total: 0,
    elapsed: performance.now() - started,
    indexing: 0
  })
  if (cancelled()) return empty()
  const query = String(request.query || '')
    .trim()
    .slice(0, 500)
  const { filters, terms } = parseQuery(query)
  const field = request.field || 'all'
  const fields: Field[] =
    field === 'title'
      ? ['titleWords']
      : field === 'content'
        ? ['contentWords']
        : field === 'url'
          ? ['urlWords']
          : ['titleWords', 'contentWords', 'urlWords']
  const limit = Math.max(1, Math.min(100, request.limit || 30)),
    offset = Math.max(0, Math.min(5000, request.offset || 0))
  const indexing = await database.pages
    .where('indexVersion')
    .below(INDEX_VERSION)
    .count()
  const count = await database.pages.count()
  if (!terms.length && !filters.length) {
    const rows = database.pages.orderBy('date')
    const ordered = request.sort === 'oldest' ? rows : rows.reverse()
    const filtered = ordered.filter(
      (p) =>
        /^https?:\/\//.test(p.url) &&
        (request.source !== 'bookmarks' || !!p.isBookmarked)
    )
    const total = await filtered.clone().count()
    const pages = await filtered.offset(offset).limit(limit).toArray()
    const contents = await database.contents.bulkGet(pages.map((p) => p.id!))
    return {
      results: pages.map((p, i) => ({
        ...p,
        score: 0,
        snippet: makeSnippet(contents[i]?.content || '', []),
        matched: []
      })),
      total,
      elapsed: performance.now() - started,
      indexing
    }
  }
  // Choose the rarest term BEFORE capping candidates. Intersecting capped posting
  // lists loses a rare match whenever its common-word posting is beyond the cap.
  type Clause = { index: Field; token: string; prefix?: boolean }
  const plans = await Promise.all(
    terms.map(async (term, i) => {
      const variants = new Map<string, number>([[term, 1]])
      const alias = aliasToken(term)
      if (alias) variants.set(alias, 0.88)
      if (stem(term) !== term) variants.set(stem(term), 0.85)
      if (request.fuzzy !== false && /^[a-z]{4,32}$/.test(term)) {
        const vocabulary = await database.terms
          .where('deletes')
          .anyOf(deletions(term))
          .distinct()
          .limit(320)
          .toArray()
        for (const v of vocabulary)
          if (editDistance(term, v.term) <= 1 && !variants.has(v.term))
            variants.set(v.term, 0.55)
      }
      const prefix = i === terms.length - 1 && /^[a-z\d]{2,}$/.test(term)
      const cjk =
        /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{3,}$/u.test(
          term
        )
      const clauses: Clause[] = fields.flatMap((index) => [
        ...[...variants.keys()].map((token) => ({ index, token })),
        ...(prefix ? [{ index, token: term, prefix: true }] : []),
        ...(cjk
          ? [{ index, token: Array.from(term).slice(0, 2).join('') }]
          : [])
      ])
      const counts = await Promise.all(clauses.map((c) => posting(c).count()))
      return {
        term,
        variants,
        prefix,
        cjk,
        clauses,
        count: counts.reduce((a, b) => a + b, 0)
      }
    })
  )
  function posting(clause: Clause) {
    const index = database.contents.where(clause.index)
    return clause.prefix
      ? index.startsWith(clause.token)
      : index.equals(clause.token)
  }
  const minimum = partial
    ? Math.max(2, Math.ceil(terms.length * 0.6))
    : terms.length
  const sortedPlans = [...plans].sort((a, b) => a.count - b.count)
  const seeds = partial
    ? sortedPlans
        .filter((p) => p.count > 0)
        .slice(0, terms.length - minimum + 1)
    : sortedPlans.slice(0, 1)
  if (cancelled()) return empty()
  let ids: number[],
    limited = false
  if (filters.length) {
    // Apply structured constraints before imposing the result cap. In particular,
    // a selective site: filter must not lose pages after a common term's cutoff.
    const pages = database.pages.orderBy('date')
    ids = await (request.sort === 'oldest' ? pages : pages.reverse())
      .filter(
        (page) =>
          /^https?:\/\//.test(page.url) &&
          (request.source !== 'bookmarks' || page.isBookmarked) &&
          matchFilters(filters, page, field, true) !== undefined
      )
      .primaryKeys()
  } else {
    const candidates = new Set<number>()
    for (const clause of seeds.flatMap((seed) => seed.clauses)) {
      const keys = await posting(clause)
        .limit(MAX_CANDIDATES + 1)
        .primaryKeys()
      keys.forEach((id) => candidates.add(id))
    }
    limited = candidates.size > MAX_CANDIDATES
    ids = [...candidates].slice(0, MAX_CANDIDATES)
  }
  const results: SearchResult[] = []
  // Bound working memory even when saved documents are large. Verify every term
  // against each candidate's complete tokens, rather than another capped list.
  batches: for (let from = 0; from < ids.length; from += 64) {
    if (cancelled()) return empty()
    const batch = ids.slice(from, from + 64)
    const pages = await database.pages.bulkGet(batch)
    const contents = await database.contents.bulkGet(batch)
    for (let i = 0; i < batch.length; i++) {
      const page = pages[i],
        content = contents[i]
      if (
        !page ||
        !content ||
        !/^https?:\/\//.test(page.url) ||
        (request.source === 'bookmarks' && !page.isBookmarked)
      )
        continue
      const filterHits = matchFilters(
        filters,
        { ...page, content: content.content },
        field
      )
      if (filterHits === undefined) continue
      const texts: Record<Field, string> = {
        titleWords: page.title,
        contentWords: content.content,
        urlWords: page.url
      }
      const matched = new Set<string>(filterHits.hits)
      const fieldHits: Partial<Record<Field, Set<string>>> = {}
      const tokenSets = Object.fromEntries(
        fields.map((index) => [index, new Set(content[index] || [])])
      ) as Record<Field, Set<string>>
      let score = filterHits.score,
        hitCount = 0,
        requiredMissing = false
      for (const plan of plans) {
        let termScore = 0
        for (const index of fields) {
          const tokens = tokenSets[index]
          let weight = 0,
            hit = plan.term
          for (const [variant, value] of plan.variants) {
            if (tokens.has(variant) && value > weight) {
              weight = value
              hit = variant.startsWith('~')
                ? [...tokens].find(
                    (token) => !token.startsWith('~') && stem(token) === variant
                  ) || plan.term
                : variant.startsWith('@alias:')
                  ? aliasMatch(normalize(texts[index]), variant)
                  : variant
            }
          }
          if (plan.prefix && weight < 0.7) {
            const token = [...tokens].find((token) =>
              token.startsWith(plan.term)
            )
            if (token) {
              weight = 0.7
              hit = token
            }
          }
          if (
            plan.cjk &&
            weight < 1 &&
            normalize(texts[index]).includes(plan.term)
          ) {
            weight = 1
            hit = plan.term
          }
          if (weight) {
            termScore += weights[index] * weight
            matched.add(hit)
            ;(fieldHits[index] ??= new Set()).add(hit)
          }
        }
        if (!termScore) {
          if (
            [
              'not',
              'no',
              'nor',
              'never',
              'without',
              '不',
              '没',
              '没有',
              '无',
              '非',
              '未',
              '别'
            ].includes(plan.term)
          ) {
            requiredMissing = true
            break
          }
          if (!partial) break
          continue
        }
        hitCount++
        score += termScore * Math.log(1 + count / (1 + plan.count))
      }
      if (requiredMissing || hitCount < minimum) continue
      if (results.length === MAX_CANDIDATES) {
        limited = true
        break batches
      }
      const exactBoost = normalize(page.title).includes(normalize(query))
        ? 12
        : 0
      const lengthPenalty =
        field === 'title'
          ? 1
          : 1 + Math.log(1 + content.content.length / 20000) * 0.15
      results.push({
        ...page,
        score:
          score / lengthPenalty +
          exactBoost +
          relevanceBoost(texts, fieldHits, terms.length, page.date),
        snippet: '',
        matched: [...matched]
      })
    }
  }
  if (!results.length && !partial && terms.length >= 3 && !filters.length) {
    const fallback = await searchPages(request, database, true, cancelled)
    return { ...fallback, elapsed: performance.now() - started }
  }
  results.sort((a, b) =>
    request.sort === 'recent'
      ? b.date - a.date
      : request.sort === 'oldest'
        ? a.date - b.date
        : b.score - a.score || b.date - a.date || a.id! - b.id!
  )
  const selected = results.slice(offset, offset + limit)
  const previewContents = await database.contents.bulkGet(
    selected.map((page) => page.id!)
  )
  selected.forEach((page, i) => {
    page.snippet = makeSnippet(previewContents[i]?.content || '', page.matched)
  })
  return {
    results: selected,
    total: results.length,
    elapsed: performance.now() - started,
    indexing,
    partial,
    limited
  }
}
export function searchTabs(
  tabs: chrome.tabs.Tab[],
  request: SearchRequest
): SearchResult[] {
  const { terms, filters } = parseQuery(request.query)
  if (request.field === 'content' && (terms.length || !filters.length))
    return []
  return tabs
    .filter((tab) => !tab.incognito && /^https?:\/\//.test(tab.url || ''))
    .flatMap((tab) => {
      const title = tab.title || tab.url!,
        url = tab.url!
      const text = canonicalQuery(
        normalize(
          request.field === 'title'
            ? title
            : request.field === 'url'
              ? url
              : `${title} ${url}`
        )
      )
      const filterHits = matchFilters(filters, { title, url }, request.field)
      if (!terms.every((t) => text.includes(t)) || filterHits === undefined)
        return []
      return [
        {
          url,
          title,
          date: tab.lastAccessed || Date.now(),
          pageId: `tab-${tab.id}`,
          isBookmarked: false,
          score: 0,
          snippet: '',
          matched: [...terms, ...filterHits.hits],
          tabId: tab.id,
          windowId: tab.windowId
        }
      ]
    })
    .sort((a, b) =>
      request.sort === 'oldest' ? a.date - b.date : b.date - a.date
    )
}
