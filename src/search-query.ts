import { normalize, queryWords } from './text'
import type { SearchRequest } from './types'

type Scope = 'all' | 'title' | 'content' | 'url'
type Filter = {
  scope?: Scope
  kind: 'phrase' | 'wildcard' | 'url' | 'site'
  value: string
  exclude: boolean
  test: (text: string) => string | undefined
}
export type SearchDocument = { title: string; content?: string; url: string }

// URLs have their own punctuation: a query-string ? is never a wildcard.
function looksLikeUrl(value: string) {
  return (
    /^(?:https?:\/\/|www\.)/i.test(value) ||
    /^(?:[\p{L}\d*-]+\.)+[\p{L}]{2,}(?::\d+)?(?:[/?#].*)?$/u.test(value)
  )
}
function folded(text: string) {
  return normalize(text).replace(/\s+/g, ' ').trim()
}
function decodedUrl(text: string) {
  // Decode valid runs without throwing on old records containing malformed %s.
  return text.replace(/(?:%[\da-f]{2})+/gi, (part) => {
    try {
      return decodeURIComponent(part)
    } catch {
      return part
    }
  })
}

// Iterative glob matching avoids exponential regular-expression backtracking.
// Match Unicode code points, so ? consumes one character, not half a surrogate.
export function globMatches(text: string, pattern: string, question = true) {
  const chars = Array.from(text),
    glob = Array.from(pattern)
  let i = 0,
    j = 0,
    star = -1,
    retry = 0
  while (i < chars.length) {
    if (
      j < glob.length &&
      glob[j] !== '*' &&
      (glob[j] === chars[i] || (question && glob[j] === '?'))
    ) {
      i++
      j++
    } else if (glob[j] === '*') {
      star = j++
      retry = i
    } else if (star >= 0) {
      j = star + 1
      i = ++retry
    } else return false
  }
  while (glob[j] === '*') j++
  return j === glob.length
}

function phraseTest(value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const wordEdge = /[\p{L}\p{N}_]/u
  const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u
  const chars = Array.from(value)
  const start =
    wordEdge.test(chars[0]) && !cjk.test(chars[0]) ? '(?<![\\p{L}\\p{N}_])' : ''
  const end =
    wordEdge.test(chars.at(-1)!) && !cjk.test(chars.at(-1)!)
      ? '(?![\\p{L}\\p{N}_])'
      : ''
  const regex = new RegExp(start + escaped + end, 'u')
  return (text: string) => (regex.test(text) ? value : undefined)
}

function siteTest(value: string) {
  try {
    const target = new URL(
      /^[a-z]+:\/\//.test(value) ? value : `https://${value}`
    )
    const subdomainsOnly = target.hostname.startsWith('*.')
    const host = target.hostname.replace(/^\*\./, '').replace(/\.$/, '')
    const path = folded(decodedUrl(target.pathname))
    if (!host || host.includes('*') || target.username || target.password)
      return () => undefined
    return (text: string) => {
      try {
        const url = new URL(text)
        const actual = url.hostname.replace(/\.$/, '')
        const hostMatch =
          (!subdomainsOnly && actual === host) || actual.endsWith('.' + host)
        const actualPath = folded(decodedUrl(url.pathname))
        const pathMatch =
          path === '/' ||
          actualPath === path ||
          actualPath.startsWith(path.endsWith('/') ? path : path + '/')
        return hostMatch &&
          pathMatch &&
          (!target.port || url.port === target.port)
          ? host
          : undefined
      } catch {
        return undefined
      }
    }
  } catch {
    return () => undefined
  }
}

function createFilter(
  value: string,
  kind: Filter['kind'],
  exclude: boolean,
  scope?: Scope,
  quoted = false
): Filter {
  let test: Filter['test']
  if (kind === 'site') test = siteTest(value)
  else if (kind === 'url') {
    test = (text) => {
      const matches = (candidate: string) =>
        !quoted && value.includes('*')
          ? globMatches(candidate, `*${value}*`, false)
          : candidate.includes(value)
      return matches(folded(text)) || matches(folded(decodedUrl(text)))
        ? value.replace(/\*/g, '')
        : undefined
    }
  } else if (kind === 'wildcard') {
    test = (text) => {
      for (const word of text.matchAll(/[\p{L}\p{N}_]+/gu))
        if (globMatches(word[0], value)) return word[0]
      return undefined
    }
  } else test = phraseTest(value)
  return { value, kind, scope, exclude, test }
}

export function parseQuery(query: string) {
  const filters: Filter[] = [],
    ordinary: string[] = []
  // Keep spaces inside quotes, including in field operators. A trailing open
  // quote is accepted while typing and treated as a phrase up to the end.
  const tokens =
    String(query || '')
      .trim()
      .slice(0, 500)
      .match(/(?:[^\s"“”]+|["“][^"“”]*(?:["”]|$))+/gu) || []
  for (let token of tokens) {
    const exclude = token.startsWith('-') && token.length > 1
    if (exclude) token = token.slice(1)
    const operator = /^(site|url|inurl|intitle|intext):/i
      .exec(token)?.[1]
      .toLowerCase()
    if (operator) token = token.slice(operator.length + 1)
    const quoted = /^["“]/.test(token)
    const value = folded(quoted ? token.replace(/^["“]|["”]$/g, '') : token)
    if (!value) continue
    const scope: Scope | undefined =
      operator === 'intitle'
        ? 'title'
        : operator === 'intext'
          ? 'content'
          : operator
            ? 'url'
            : undefined
    const kind =
      operator === 'site'
        ? 'site'
        : operator === 'url' ||
            operator === 'inurl' ||
            (!operator && !quoted && looksLikeUrl(value))
          ? 'url'
          : !quoted && /[*?]/.test(value)
            ? 'wildcard'
            : 'phrase'
    if (operator || exclude || quoted || kind !== 'phrase')
      filters.push(
        createFilter(
          value,
          kind,
          exclude,
          kind === 'url' ? 'url' : scope,
          quoted
        )
      )
    else ordinary.push(token)
  }
  return { terms: queryWords(ordinary.join(' ')), filters }
}

export type ParsedQuery = ReturnType<typeof parseQuery>

// Metadata filtering happens before loading page bodies, so a site/URL/title
// query does not read every archived document. Undefined means no match.
export function matchFilters(
  filters: ParsedQuery['filters'],
  document: SearchDocument,
  field: SearchRequest['field'] = 'all',
  metadataOnly = false
): { hits: string[]; score: number } | undefined {
  const normalized = new Map<Scope, string>()
  const hits: string[] = []
  let score = 0
  for (const filter of filters) {
    const scope = filter.scope || field
    if (metadataOnly && (scope === 'all' || scope === 'content')) continue
    const scopes =
      scope === 'all' ? (['title', 'content', 'url'] as const) : [scope]
    let hit: string | undefined
    for (const key of scopes) {
      if (key === 'content' && document.content === undefined) continue
      if (filter.kind === 'url' || filter.kind === 'site') {
        hit = filter.test(document.url)
      } else {
        if (!normalized.has(key))
          normalized.set(key, folded(document[key] || ''))
        hit = filter.test(normalized.get(key)!)
      }
      if (hit !== undefined) {
        if (!filter.exclude)
          score += key === 'title' ? 5 : key === 'url' ? 2 : 1
        break
      }
    }
    if (filter.exclude ? hit !== undefined : hit === undefined) return undefined
    if (!filter.exclude && hit) hits.push(hit)
  }
  return { hits, score }
}
