import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PageDatabase, savePage } from '../src/database'
import { searchPages, searchTabs } from '../src/search'
import { globMatches, parseQuery } from '../src/search-query'
import type { SearchRequest } from '../src/types'

const records = [
  {
    url: 'https://example.com/docs/browser',
    title: 'Browser history guide',
    content:
      'A browser history guide. JavaScript, colour, café. 全文书签搜索。 to be or not to be. C++ tutorial.',
    isBookmarked: true
  },
  {
    url: 'https://docs.example.com/docs/mobile',
    title: 'Mobile browsers',
    content:
      'A browser keeps a history. TypeScript color. Running and scar tissue. 全文搜索。'
  },
  {
    url: 'https://notexample.com/docs/browser',
    title: 'Browser history guidebook',
    content: 'Browser history. JavaScript. run car.'
  },
  {
    url: 'https://example.com.evil.test/docs/browser',
    title: 'Other guide',
    content: 'A browser history guide. Example.com is mentioned only in text.'
  },
  { url: 'https://example.com/docs-old', title: 'Browser', content: 'history' },
  {
    url: 'https://other.test/search?q=browser&lang=en',
    title: 'Query parameters',
    content: 'Literal wildcard tokens: brow* and br?wser. aaaaab. 中文短语 café'
  },
  {
    url: 'https://other.test/%E4%B8%AD%E6%96%87/%ZZ',
    title: 'Unicode URL',
    content: 'Saved page'
  },
  {
    url: 'https://other.test/docs/example.com',
    title: 'URL containing another domain',
    content: 'Saved page'
  }
]

async function withDB(run: (db: PageDatabase) => Promise<void>) {
  const db = new PageDatabase('search-syntax-' + crypto.randomUUID())
  try {
    for (const [index, record] of records.entries())
      await savePage({ ...record, date: index + 1 }, db)
    await run(db)
  } finally {
    await db.delete()
  }
}

async function urls(
  db: PageDatabase,
  query: string,
  request: Partial<SearchRequest> = {}
) {
  return (await searchPages({ query, fuzzy: true, ...request }, db)).results
    .map((r) => r.url)
    .sort()
}
const expected = (...indexes: number[]) =>
  indexes.map((i) => records[i].url).sort()

test('wildcards match whole words with prefixes, suffixes, infixes, Unicode and no fuzzy expansion', () =>
  withDB(async (db) => {
    for (const [query, indexes] of [
      ['brow*', [0, 1, 2, 3, 4, 5]],
      ['*script', [0, 1, 2]],
      ['br?wser', [0, 1, 2, 3, 4, 5]],
      ['colo?r', [0]],
      ['bro?serz', []],
      ['全文*搜索', [0, 1]],
      ['"brow*"', [5]],
      ['"br?wser"', [5]],
      ['"aaaa*a*a*a*a*b"', []]
    ] as const)
      assert.deepEqual(await urls(db, query), expected(...indexes), query)
    assert.equal(globMatches('a🙂b', 'a?b'), true)
    assert.equal(globMatches('ab', 'a?b'), false)
    assert.equal(globMatches('a'.repeat(50000), '*a*a*a*a*a*b'), false)
  }))

test('exact phrases preserve word boundaries, punctuation, stop words and fields', () =>
  withDB(async (db) => {
    for (const [query, indexes] of [
      ['"browser history guide"', [0, 3]],
      ['“browser history guide”', [0, 3]],
      ['"to be or not to be"', [0]],
      ['"C++"', [0]],
      ['"run"', [2]],
      ['"car"', [2]],
      ['"JS"', []],
      ['"browser history"', [0, 2, 3]],
      ['"CAFE"', [0, 5]],
      ['"全文書籤搜索"', [0]],
      ['"中文短语', [5]]
    ] as const)
      assert.deepEqual(await urls(db, query), expected(...indexes), query)
    assert.deepEqual(
      await urls(db, '"browser history guide"', { field: 'title' }),
      expected(0)
    )
    assert.deepEqual(
      await urls(db, '"browser history guide"', { field: 'url' }),
      []
    )
    assert.equal(
      (await searchPages({ query: '"browser history guide"' }, db)).results[0]
        .url,
      records[0].url,
      'an exact title phrase outranks a newer page with only a body match'
    )
  }))

test('site filters use hostname boundaries, optional paths, subdomains and exclusions', () =>
  withDB(async (db) => {
    for (const [query, indexes] of [
      ['site:example.com', [0, 1, 4]],
      ['SITE:example.com/docs', [0, 1]],
      ['site:https://example.com/docs/', [0, 1]],
      ['site:*.example.com', [1]],
      ['browser -site:example.com', [2, 3, 5]],
      ['site:example.com -mobile', [0, 4]],
      ['site:example.com -site:docs.example.com', [0, 4]],
      ['site:example.com.evil.test', [3]],
      ['site:notexample.com', [2]],
      ['site:bad[host', []]
    ] as const)
      assert.deepEqual(await urls(db, query), expected(...indexes), query)
    assert.deepEqual(
      await urls(db, 'site:example.com', { source: 'bookmarks' }),
      expected(0)
    )
  }))

test('URL queries retain punctuation, match decoded Unicode and never search page bodies', () =>
  withDB(async (db) => {
    for (const [query, indexes] of [
      ['https://example.com/docs/browser', [0]],
      ['example.com/docs/browser', [0, 2]],
      ['url:example.com/*/browser', [0, 2]],
      ['*.example.com/docs/*', [1]],
      ['inurl:browser', [0, 2, 3, 5]],
      ['url:/search?q=browser&lang=en', [5]],
      ['https://other.test/search?q=browser&lang=en', [5]],
      ['url:/搜索', []],
      ['url:/中文/%ZZ', [6]],
      ['url:/docs/ -url:mobile', [0, 2, 3, 7]],
      ['url:"brow*"', []],
      ['url:(browser)', []]
    ] as const)
      assert.deepEqual(await urls(db, query), expected(...indexes), query)
    assert.deepEqual(
      await urls(db, 'url:other.test', { field: 'title' }),
      expected(5, 6, 7)
    )
  }))

test('field operators, negative phrases and combined conditions remain strict', () =>
  withDB(async (db) => {
    for (const [query, indexes] of [
      ['intitle:"browser history"', [0, 2]],
      ['intitle:guid*', [0, 2, 3]],
      ['intitle:guide', [0, 3]],
      ['intext:"browser history" -intitle:other', [0, 2]],
      ['site:example.com intitle:brow* -mobile', [0, 4]],
      ['browser -"browser history"', [1, 4, 5]],
      ['intitle:brow* -intext:Java*', [1, 4]],
      ['site:example.com browser history absentword', []]
    ] as const)
      assert.deepEqual(await urls(db, query), expected(...indexes), query)
    assert.deepEqual(
      await urls(db, 'intitle:"Browser history"', { field: 'content' }),
      expected(0, 2)
    )
    const result = await searchPages(
      { query: 'site:example.com browser history absentword' },
      db
    )
    assert.equal(result.partial, false)
    assert.ok(
      (await searchPages({ query: '*script' }, db)).results.some((r) =>
        r.matched.includes('javascript')
      )
    )
    assert.deepEqual(
      (
        await searchPages(
          { query: 'site:example.com', sort: 'oldest', offset: 1, limit: 1 },
          db
        )
      ).results.map((r) => r.url),
      [records[1].url]
    )
    assert.equal(
      (await searchPages({ query: 'site:example.com' }, db, false, () => true))
        .total,
      0
    )
    assert.deepEqual(
      parseQuery('site:example.com "exact phrase" brow* -mobile plain').terms,
      ['plain']
    )
  }))

test('open tabs share exact, wildcard, URL and exclusion semantics without crossing title/URL boundaries', () => {
  const tabs = records.map((r, i) => ({
    id: i + 1,
    windowId: 1,
    title: r.title,
    url: r.url,
    lastAccessed: i + 1,
    incognito: false
  })) as chrome.tabs.Tab[]
  tabs.push({
    id: 50,
    title: 'Private browser',
    url: 'https://example.com/private',
    incognito: true
  } as chrome.tabs.Tab)
  tabs.push({
    id: 51,
    title: 'Browser settings',
    url: 'chrome://settings/'
  } as chrome.tabs.Tab)
  const queries = [
    ['site:example.com', [0, 1, 4]],
    ['intitle:brow* -mobile', [0, 2, 4]],
    ['"browser history guide"', [0]],
    ['"browser https"', []],
    ['https://other.test/search?q=browser&lang=en', [5]],
    ['site:example.com intext:browser', []],
    ['site:example.com -intext:browser', [0, 1, 4]]
  ] as const
  for (const [query, indexes] of queries)
    assert.deepEqual(
      searchTabs(tabs, { query })
        .map((r) => r.url)
        .sort(),
      expected(...indexes),
      query
    )
})

test('structured filtering finds rare matches after 5,000 nonmatching pages', async () => {
  const db = new PageDatabase('syntax-cap-' + crypto.randomUUID())
  try {
    await db.pages.bulkAdd(
      Array.from({ length: 5005 }, (_, i) => ({
        id: i + 1,
        url: `https://${i === 0 ? 'rare' : 'common'}.test/${i}`,
        title: i === 0 ? 'Browser needle' : 'Browser',
        date: i,
        pageId: String(i),
        isBookmarked: true,
        indexVersion: 3
      }))
    )
    await db.contents.bulkAdd(
      Array.from({ length: 5005 }, (_, i) => ({
        pid: i + 1,
        content: i === 0 ? 'browser needleword' : 'browser',
        contentWords: ['browser'],
        titleWords: ['browser'],
        urlWords: []
      }))
    )
    for (const query of [
      'site:rare.test browser',
      'intitle:needle',
      '*needle*'
    ]) {
      const response = await searchPages({ query, fuzzy: false }, db)
      assert.equal(response.total, 1, query)
      assert.equal(response.results[0].id, 1, query)
      assert.equal(response.limited, false, query)
    }
    const broad = await searchPages({ query: 'site:common.test' }, db)
    assert.equal(broad.total, 5000)
    assert.equal(broad.limited, true)
  } finally {
    await db.delete()
  }
})
