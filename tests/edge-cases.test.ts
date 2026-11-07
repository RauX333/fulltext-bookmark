import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import Dexie from 'dexie'
import { PageDatabase, reindexBatch, savePage } from '../src/database'
import { searchPages } from '../src/search'
import { testRemote } from '../src/remote'
import { defaults } from '../src/settings'
test('migration retains duplicate URLs, invalid legacy URLs and unlimited legacy text', async () => {
  const name = 'duplicate-' + crypto.randomUUID(),
    old = new Dexie(name)
  old.version(1).stores({
    pages: '++id,url,title,date,pageId,isBookmarked',
    contents: '&pid,*contentWords,*titleWords,content',
    vectors: '++id,pid,serial'
  })
  for (const [id, url] of [
    [1, 'https://duplicate.test'],
    [2, 'https://duplicate.test'],
    [3, 'chrome://settings']
  ] as const) {
    await old.table('pages').add({
      id,
      url,
      title: 'Legacy ' + id,
      pageId: String(id),
      date: 1,
      isBookmarked: true
    })
    await old.table('contents').add({
      pid: id,
      content: 'unique' + id,
      contentWords: [],
      titleWords: []
    })
  }
  old.close()
  const db = new PageDatabase(name)
  try {
    assert.equal(await reindexBatch(db), 0)
    assert.equal(await db.pages.count(), 3)
    assert.equal((await db.contents.get(2))?.content, 'unique2')
    assert.equal((await searchPages({ query: 'unique3' }, db)).total, 0)
  } finally {
    await db.delete()
  }
})
test('bad URL encoding does not break capture and removing tokens removes stale hits', async () => {
  const db = new PageDatabase('encoded-' + crypto.randomUUID())
  try {
    await savePage(
      {
        url: 'https://example.com/%ZZ',
        title: 'Test',
        content: 'obsoleteword'
      },
      db
    )
    await savePage(
      {
        url: 'https://example.com/%ZZ',
        title: 'New',
        content: 'replacementword'
      },
      db
    )
    assert.equal((await searchPages({ query: 'obsoleteword' }, db)).total, 0)
    assert.equal((await searchPages({ query: 'replacementword' }, db)).total, 1)
  } finally {
    await db.delete()
  }
})
test('API connection test sends a synthetic record and surfaces HTTP failure', async () => {
  const original = globalThis.fetch
  let body: any
  globalThis.fetch = async (_url, init) => {
    body = JSON.parse(String(init?.body))
    return new Response('', { status: 204 })
  }
  try {
    // A successful test must not attach captured content or history.
    globalThis.fetch = async (_url, init) => {
      body = JSON.parse(String(init?.body))
      return new Response(null, { status: 204 })
    }
    assert.match(
      await testRemote({
        ...defaults,
        remoteStoreURL: 'https://example.com/api'
      }),
      /204/
    )
    assert.equal(body.title, 'Fulltext Bookmark connection test')
    assert.equal(body.content, undefined)
    globalThis.fetch = async () => new Response('', { status: 401 })
    await assert.rejects(
      testRemote({ ...defaults, remoteStoreURL: 'https://example.com/api' }),
      /401/
    )
  } finally {
    globalThis.fetch = original
  }
})

test('a common posting cap cannot hide a rare match later in the archive', async () => {
  const db = new PageDatabase('posting-cap-' + crypto.randomUUID())
  try {
    await db.pages.bulkAdd(
      Array.from({ length: 5005 }, (_, i) => ({
        id: i + 1,
        url: `https://example.com/${i}`,
        title: 'Browser',
        date: i,
        pageId: String(i),
        isBookmarked: true,
        indexVersion: 2
      }))
    )
    await db.contents.bulkAdd(
      Array.from({ length: 5005 }, (_, i) => ({
        pid: i + 1,
        content: i === 5004 ? 'browser rarewillow' : 'browser',
        contentWords: i === 5004 ? ['browser', 'rarewillow'] : ['browser'],
        titleWords: ['browser'],
        urlWords: []
      }))
    )
    const result = await searchPages(
      { query: 'browser rarewillow', fuzzy: false },
      db
    )
    assert.equal(result.total, 1)
    assert.equal(result.results[0].id, 5005)
    assert.equal(result.limited, false)
  } finally {
    await db.delete()
  }
})

test('restoring a backup does not truncate original text longer than the new capture limit', async () => {
  const db = new PageDatabase('long-backup-' + crypto.randomUUID())
  try {
    const content = 'preserved '.repeat(100001)
    const { id } = await savePage(
      {
        url: 'https://legacy.example/long',
        title: 'Long legacy text',
        content,
        source: 'import'
      },
      db
    )
    assert.equal((await db.contents.get(id))?.content, content)
  } finally {
    await db.delete()
  }
})

test('automatic recaptures merge previously visited comments without duplicating text', async () => {
  const db = new PageDatabase('revisit-' + crypto.randomUUID())
  try {
    const first = await savePage(
      {
        url: 'https://revisit.test',
        title: 'Article',
        content: 'Original body\nEarlierComment'
      },
      db
    )
    await savePage(
      {
        url: 'https://revisit.test',
        title: 'Article',
        content: 'Original body\nNewComment',
        mergeContent: true
      },
      db
    )
    await savePage(
      {
        url: 'https://revisit.test',
        title: 'Article',
        content: 'Original body\nNewComment',
        mergeContent: true
      },
      db
    )
    assert.equal(
      (await db.contents.get(first.id))?.content,
      'Original body\nEarlierComment\nNewComment'
    )
    assert.equal((await searchPages({ query: 'EarlierComment' }, db)).total, 1)
  } finally {
    await db.delete()
  }
})
