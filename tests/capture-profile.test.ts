import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PageDatabase, savePage } from '../src/database'
import { searchPages } from '../src/search'
import { SeenText } from '../src/capture'

test('scoped snapshots preserve repeated table values, code lines and current order across saves', async () => {
  const db = new PageDatabase('table-snapshot-' + crypto.randomUUID())
  const seen = new SeenText()
  const initial = 'Model A\n1M\n128K\nModel B\n1M\n128K\nHistoricalComment'
  const updated = 'Model A\n2M\n128K\nModel B\n1M\n128K\nNewComment'
  const base = {
    url: 'https://docs.bigmodel.cn/table',
    title: 'Model table',
    captureProfile: 'bigmodel-docs:2',
    mergeContent: true
  }
  try {
    assert.equal(seen.add(initial, true), initial)
    const record = await savePage(
      { ...base, content: seen.add(initial, true) },
      db
    )
    await savePage({ ...base, content: seen.add(updated, true) }, db)
    assert.equal(
      (await db.contents.get(record.id))?.content,
      updated + '\nHistoricalComment'
    )
    await savePage({ ...base, content: updated }, db)
    assert.equal(
      (await db.contents.get(record.id))?.content,
      updated + '\nHistoricalComment'
    )
    assert.equal(
      (await searchPages({ query: 'HistoricalComment' }, db)).total,
      1
    )
  } finally {
    await db.delete()
  }
})

test('first scoped recapture removes legacy chrome; later scoped visits retain discussion history', async () => {
  const db = new PageDatabase('capture-profile-' + crypto.randomUUID())
  const base = { url: 'https://docs.python.org/3/tutorial/', title: 'Tutorial' }
  try {
    const initial = await savePage(
      {
        ...base,
        content: 'ArticleCedar\nLegacyAdvertPine',
        isBookmarked: true
      },
      db
    )
    const clean = await savePage(
      {
        ...base,
        content: 'ArticleCedar\nCommentWillow',
        mergeContent: true,
        captureProfile: 'sphinx-docs:1'
      },
      db
    )
    assert.equal(clean.id, initial.id)
    assert.equal((await db.pages.get(initial.id))?.isBookmarked, true)
    assert.equal(
      (await db.pages.get(initial.id))?.captureProfile,
      'sphinx-docs:1'
    )
    assert.equal(
      (await searchPages({ query: 'LegacyAdvertPine' }, db)).total,
      0
    )
    await savePage(
      {
        ...base,
        content: 'ArticleCedar\nNewCommentBirch',
        mergeContent: true,
        captureProfile: 'sphinx-docs:1'
      },
      db
    )
    assert.equal((await searchPages({ query: 'CommentWillow' }, db)).total, 1)
    assert.equal((await searchPages({ query: 'NewCommentBirch' }, db)).total, 1)
    await savePage({ ...base, source: 'bookmark', isBookmarked: true }, db)
    assert.equal(
      (await db.pages.get(initial.id))?.captureProfile,
      'sphinx-docs:1'
    )
    assert.equal(
      (await db.contents.get(initial.id))?.content,
      'ArticleCedar\nNewCommentBirch\nCommentWillow'
    )
  } finally {
    await db.delete()
  }
})
