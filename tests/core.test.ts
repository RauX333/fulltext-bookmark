import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import Dexie from 'dexie'
import {
  PageDatabase,
  savePage,
  reindexBatch,
  expirePages,
  deletePages
} from '../src/database'
import { searchPages } from '../src/search'
import { indexWords, normalizeUrl, queryWords } from '../src/text'
import { migrateSettings, isExcluded } from '../src/settings'
import {
  exportBackup,
  toCSV,
  parseBackup,
  importPages,
  encryptBackup,
  decryptBackup
} from '../src/backup'
const database = () => new PageDatabase('test-' + crypto.randomUUID())
async function withDB(fn: (db: PageDatabase) => Promise<void>) {
  const db = database()
  try {
    await fn(db)
  } finally {
    await db.delete()
  }
}
test('legacy Redux strings, false values, exclusions and zero retention survive', () => {
  const settings = migrateSettings(
    JSON.stringify({
      storeEveryPage: 'false',
      maxResults: '50',
      forbiddenURLs: JSON.stringify(['*private*']),
      tempPageExpireTime: '0'
    })
  )
  assert.equal(settings.storeEveryPage, false)
  assert.equal(settings.maxResults, 50)
  assert.equal(settings.tempPageExpireTime, 0)
  assert.deepEqual(settings.forbiddenURLs, ['*private*'])
  assert.equal(
    isExcluded('https://a.com/private?a=1', settings.forbiddenURLs),
    true
  )
  assert.equal(
    isExcluded('https://example.com/a', ['https://example.com/*']),
    true
  )
  assert.equal(
    isExcluded('https://exampleXcom/a', ['https://example.com/*']),
    false
  )
  assert.equal(isExcluded('https://a.com', ['/[broken/']), false)
})
test('CJK ngrams, normalization and stop words', () => {
  assert.ok(indexWords('南京市长江大桥').includes('长江'))
  assert.ok(indexWords('Ｃａｆé running').includes('cafe'))
  assert.deepEqual(queryWords('the history of browsers'), [
    'history',
    'browsers'
  ])
  assert.deepEqual(
    queryWords('这个网页的评论呢').filter((x) => ['的', '呢'].includes(x)),
    []
  )
})
test('URL identity preserves SPA routes and blocks executable links', () => {
  assert.equal(
    normalizeUrl('https://example.com/a#heading'),
    'https://example.com/a'
  )
  assert.equal(
    normalizeUrl('https://example.com/#/page/2'),
    'https://example.com/#/page/2'
  )
  assert.throws(() => normalizeUrl('javascript:alert(1)'))
  assert.throws(() => normalizeUrl('https://user:pass@example.com'))
})
test('captures update the same page, retain metadata-only body and await commits', () =>
  withDB(async (db) => {
    const first = await savePage(
      {
        url: 'https://example.com',
        title: 'First',
        content: 'initial article',
        pageId: 'one'
      },
      db
    )
    const next = await savePage(
      {
        url: 'https://example.com',
        title: 'First',
        content: 'initial article\n异步评论',
        pageId: 'one'
      },
      db
    )
    assert.equal(first.id, next.id)
    assert.equal(await db.pages.count(), 1)
    assert.match((await db.contents.get(first.id))!.content, /异步评论/)
    const unchanged = await savePage(
      {
        url: 'https://example.com',
        title: 'First',
        content: 'initial article\n异步评论'
      },
      db
    )
    assert.equal(unchanged.changed, false)
    await savePage(
      { url: 'https://example.com', title: 'Bookmark', isBookmarked: true },
      db
    )
    assert.match((await db.contents.get(first.id))!.content, /异步评论/)
  }))
test('concurrent same URL writes are atomic and do not duplicate', () =>
  withDB(async (db) => {
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        savePage(
          { url: 'https://race.test', title: 'Race', content: `content ${i}` },
          db
        )
      )
    )
    assert.equal(await db.pages.count(), 1)
    assert.equal(await db.contents.count(), 1)
  }))
test('Chinese, English typos/stems, prefix, field filters, phrase and ranking', () =>
  withDB(async (db) => {
    await savePage(
      {
        url: 'https://a.test',
        title: 'Browser history',
        content:
          '保存网页文字和异步加载的评论。 Running browsers are useful. The history of science.',
        isBookmarked: true
      },
      db
    )
    await savePage(
      {
        url: 'https://b.test',
        title: 'Unrelated page',
        content: 'browser history and science and running',
        date: Date.now() + 1000
      },
      db
    )
    await savePage(
      { url: 'https://c.test', title: 'No match', content: 'history alone' },
      db
    )
    assert.equal(
      (await searchPages({ query: 'the browser history' }, db)).results[0].url,
      'https://a.test/'
    )
    assert.equal(
      (await searchPages({ query: 'broesers', fuzzy: true }, db)).total,
      1
    )
    assert.equal(
      (await searchPages({ query: 'broesers', fuzzy: false }, db)).total,
      0
    )
    assert.equal(
      (await searchPages({ query: 'browsre', fuzzy: true }, db)).total,
      2
    )
    assert.equal(
      (await searchPages({ query: 'run', field: 'content' }, db)).total,
      2
    )
    assert.equal(
      (await searchPages({ query: 'brow', field: 'title' }, db)).total,
      1
    )
    assert.equal(
      (await searchPages({ query: '异步加载的评论呢' }, db)).total,
      1
    )
    assert.equal(
      (await searchPages({ query: '"history of science"' }, db)).total,
      1
    )
    assert.equal(
      (await searchPages({ query: 'browser history', source: 'bookmarks' }, db))
        .total,
      1
    )
    assert.equal(
      (await searchPages({ query: '', sort: 'recent' }, db)).results[0].url,
      'https://b.test/'
    )
  }))
test('v1 database upgrades without changing ids, text, bookmarks or legacy vectors', async () => {
  const name = 'legacy-' + crypto.randomUUID(),
    old = new Dexie(name)
  old.version(1).stores({
    pages: '++id,url,title,date,pageId,isBookmarked',
    contents: '&pid,*contentWords,*titleWords,content',
    vectors: '++id,pid,serial'
  })
  await old.table('pages').add({
    id: 42,
    url: 'https://legacy.test/',
    title: '旧资料',
    date: 1234,
    pageId: 'old-id',
    isBookmarked: true
  })
  await old.table('contents').add({
    pid: 42,
    content: '以前用户保存的重要中文内容',
    titleWords: ['旧资料'],
    contentWords: ['以前']
  })
  await old
    .table('vectors')
    .add({ pid: 42, serial: 0, vectorBlob: new Blob(['legacy']) })
  old.close()
  const db = new PageDatabase(name)
  try {
    await db.open()
    assert.equal(await db.vectors.count(), 1)
    assert.equal(await reindexBatch(db), 0)
    const page = await db.pages.get(42)
    assert.equal(page?.pageId, 'old-id')
    assert.equal(page?.date, 1234)
    assert.equal(page?.isBookmarked, true)
    assert.equal((await searchPages({ query: '重要中文内容' }, db)).total, 1)
    db.close()
    await db.open()
    assert.equal((await searchPages({ query: '重要中文内容' }, db)).total, 1)
  } finally {
    await db.delete()
  }
})
test('expiration and delete remove indexes/vectors but preserve bookmarks', () =>
  withDB(async (db) => {
    const page = await savePage(
      {
        url: 'https://old.test',
        title: 'old',
        content: 'obsoleteword',
        date: 1
      },
      db
    )
    await db.vectors.add({ pid: page.id, serial: 1 })
    await savePage(
      {
        url: 'https://bookmark.test',
        title: 'keep',
        content: 'retainedword',
        date: 1,
        isBookmarked: true
      },
      db
    )
    assert.equal(await expirePages(0, db), 0)
    assert.equal(await expirePages(86400000, db), 1)
    assert.equal(await db.vectors.count(), 0)
    assert.equal(await db.terms.get('obsoleteword'), undefined)
    assert.equal((await searchPages({ query: 'retainedword' }, db)).total, 1)
    await deletePages(
      (await db.pages.toArray()).map((p) => p.id!),
      db
    )
    assert.equal(await db.terms.count(), 0)
  }))
test('CSV round trip preserves quotes, commas, Unicode, newlines and formula text', () =>
  withDB(async (db) => {
    await savePage(
      {
        url: 'https://csv.test',
        title: '=SUM(1,2)',
        content: '第一行,"quoted"\n第二行\nEnglish café'
      },
      db
    )
    const backup = await exportBackup(db),
      csv = toCSV(backup),
      restored = parseBackup(csv)
    assert.equal(restored[0].title, backup.pages[0].title)
    assert.equal(restored[0].content, backup.pages[0].content)
    assert.equal(restored[0].date, backup.pages[0].date)
    assert.throws(
      () => parseBackup('URL,Title,Date,Bookmarked,Content\n"unclosed'),
      /CSV/
    )
  }))
test('legacy Dexie backup joins text by pid and merges without overwriting newer text', () =>
  withDB(async (db) => {
    const rows = parseBackup(
      JSON.stringify({
        data: {
          data: [
            {
              tableName: 'pages',
              rows: [
                {
                  id: 4,
                  title: 'Old',
                  url: 'https://import.test',
                  date: 1,
                  isBookmarked: true
                }
              ]
            },
            {
              tableName: 'contents',
              rows: [{ pid: 4, content: 'old original text' }]
            }
          ]
        }
      })
    )
    await savePage(
      {
        url: 'https://import.test',
        title: 'New',
        content: 'new original text',
        date: 2
      },
      db
    )
    await importPages(rows, undefined, db)
    assert.equal((await db.contents.toArray())[0].content, 'new original text')
    assert.equal((await db.pages.toArray())[0].isBookmarked, true)
  }))
test('encrypted backups authenticate password and reject tampering', async () => {
  const plain = JSON.stringify({
    format: 'fulltext-bookmark',
    version: 2,
    pages: []
  })
  const encrypted = await encryptBackup(plain, 'test-password-安全')
  assert.equal(await decryptBackup(encrypted, 'test-password-安全'), plain)
  await assert.rejects(decryptBackup(encrypted, 'wrong-password'))
  const tampered = JSON.parse(encrypted)
  tampered.data = 'AAAA' + tampered.data.slice(4)
  await assert.rejects(
    decryptBackup(JSON.stringify(tampered), 'test-password-安全')
  )
})
