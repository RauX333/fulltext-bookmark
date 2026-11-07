import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PageDatabase, savePage } from '../src/database'
import { searchPages } from '../src/search'
import { queryWords } from '../src/text'

const documents = [
  {
    key: 'js',
    title: 'JavaScript 闭包详解',
    content:
      'JavaScript closures preserve lexical scope and are useful in browser extensions.'
  },
  {
    key: 'api',
    title: 'API reference',
    content:
      'An application programming interface for indexing saved documents.'
  },
  {
    key: 'cpu',
    title: 'CPU architecture',
    content: 'CPU cache performance and instruction pipelines.'
  },
  {
    key: 'usa',
    title: 'Travel in the U.S.A.',
    content: 'Travel guide to the United States of America.'
  },
  {
    key: 'chinese',
    title: '瀏覽器中的歷史記錄搜尋',
    content: '儲存網頁正文和異步載入的評論，之後進行全文搜尋。'
  },
  {
    key: 'phrase',
    title: 'Browser history search',
    content: 'A guide to browser history search and full text retrieval.'
  },
  {
    key: 'scattered',
    title: 'Browser storage guide',
    content:
      'Browser APIs. ' +
      'Miscellaneous unrelated topics. '.repeat(40) +
      'History of storage. ' +
      'Other unrelated paragraphs. '.repeat(40) +
      'Search tips.'
  },
  {
    key: 'spam',
    title: 'Other resources',
    content: 'browser history search '.repeat(1000)
  },
  {
    key: 'negative',
    title: 'Browser does not save',
    content: "The browser doesn't save private pages."
  },
  {
    key: 'positive',
    title: 'Browser saves pages',
    content: 'The browser saves pages automatically.'
  },
  {
    key: 'partial',
    title: 'Orchid magnolia guide',
    content: 'Orchid magnolia flowers bloom in spring.'
  },
  {
    key: 'ambiguous',
    title: 'Project management handbook',
    content: 'Project managers organize teams and track tasks.'
  },
  {
    key: 'literal',
    title: 'To be or not to be',
    content: 'A discussion of this exact quotation.'
  }
]
const queries = [
  ['JS 闭包', 'js'],
  ['the JavaScript closures in a browser', 'js'],
  ['application programming interface', 'api'],
  ['中央处理器', 'cpu'],
  ['U.S.A.', 'usa'],
  ['USA', 'usa'],
  ['浏览器的历史记录呢', 'chinese'],
  ['网页正文 评论', 'chinese'],
  ['browser history search', 'phrase'],
  ['browesr history', 'phrase'],
  ["browser doesn't save", 'negative'],
  ['orchid magnolia unavailableword', 'partial'],
  ['"to be or not to be"', 'literal']
] as const

test('relevance corpus: bilingual stop words, aliases, contractions, exact phrases and ordering', async () => {
  const db = new PageDatabase('relevance-' + crypto.randomUUID())
  try {
    for (const d of documents)
      await savePage(
        { ...d, url: 'https://example.org/' + d.key, date: 1700000000000 },
        db
      )
    for (const [query, expected] of queries) {
      const result = await searchPages({ query }, db)
      assert.equal(
        result.results[0]?.url,
        'https://example.org/' + expected,
        query
      )
    }
    assert.equal(
      (await searchPages({ query: '"JS closures"' }, db)).total,
      0,
      'quoted phrases must not expand aliases'
    )
    assert.equal(
      (await searchPages({ query: 'PM', fuzzy: false }, db)).total,
      0,
      'ambiguous abbreviations must not invent a meaning'
    )
    assert.equal(
      (await searchPages({ query: 'orchid magnolia unavailableword' }, db))
        .partial,
      true
    )
    assert.equal(
      (await searchPages({ query: 'orchid magnolia not' }, db)).total,
      0,
      'partial fallback must preserve negation'
    )
    assert.ok(queryWords("doesn't save").includes('not'))
    console.log(
      `Relevance fixtures: ${queries.length}/${queries.length} expected first results`
    )
  } finally {
    await db.delete()
  }
})
