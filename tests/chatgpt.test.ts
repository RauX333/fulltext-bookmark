import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  chatGPTConversationUrl,
  chatConversationUrl,
  chatSiteNames,
  readConversation,
  type ChatMessage
} from '../src/chatgpt-data'
import {
  defaults,
  migrateSettings,
  allowsAutomaticCapture
} from '../src/settings'
import { PageDatabase, savePage, reindexBatch } from '../src/database'
import { searchPages } from '../src/search'
import { exportBackup, parseBackup, importPages } from '../src/backup'

test('ChatGPT defaults and conversation origins are strict and separate from generic capture', () => {
  assert.equal(migrateSettings({}).chatgptSupport, true)
  assert.equal(migrateSettings({}).chatgptAutoCapture, true)
  assert.equal(
    migrateSettings({ chatgptAutoCapture: false }).chatgptAutoCapture,
    false
  )
  assert.equal(
    allowsAutomaticCapture('https://chatgpt.com/c/abc', defaults),
    false
  )
  assert.equal(
    chatGPTConversationUrl('https://chat.openai.com/c/abc?ref=x#foo'),
    'https://chatgpt.com/c/abc'
  )
  assert.equal(
    chatGPTConversationUrl('https://chatgpt.com/g/g-project/c/abc/'),
    'https://chatgpt.com/c/abc'
  )
  for (const url of [
    'https://chatgpt.com/',
    'https://chatgpt.com.evil.test/c/a',
    'https://evil.test/c/a',
    'https://u:p@chatgpt.com/c/a',
    'http://chatgpt.com/c/a',
    'https://chatgpt.com:444/c/a'
  ])
    assert.equal(chatGPTConversationUrl(url), undefined)
  assert.equal(
    readConversation({
      site: 'chatgpt',
      messages: [{ id: 'a', role: 'system', text: 'test', order: 0 }]
    }),
    undefined
  )
})

test('Gemini and DeepSeek validate origins, default on, merge and restore structured chats', async () => {
  for (const [site, url] of [
    ['gemini', 'https://gemini.google.com/app/abcdef123'],
    ['deepseek', 'https://chat.deepseek.com/a/chat/s/abc-123']
  ] as const) {
    assert.equal(migrateSettings({})[`${site}Support`], true)
    assert.equal(migrateSettings({})[`${site}AutoCapture`], true)
    assert.equal(allowsAutomaticCapture(url, defaults), false)
    assert.equal(chatConversationUrl(url + '?source=test#anchor', site), url)
    for (const bad of [
      url.replace('https:', 'http:'),
      url.replace('.com', '.com.evil.test'),
      url.replace('https://', 'https://u:p@'),
      url.replace('.com', '.com:444'),
      new URL(url).origin + '/'
    ])
      assert.equal(chatConversationUrl(bad, site), undefined)
    assert.equal(chatConversationUrl(url, 'chatgpt'), undefined)
    const db = new PageDatabase(`${site}-${crypto.randomUUID()}`)
    const restored = new PageDatabase(`${site}-restore-${crypto.randomUUID()}`)
    try {
      const messages: ChatMessage[] = [
        { id: 'u', role: 'user', text: 'CedarQuestion', order: 0 },
        { id: 'a', role: 'assistant', text: 'WillowAnswer', order: 1 }
      ]
      await savePage(
        { url, title: site, conversation: { site, messages: [messages[0]] } },
        db
      )
      await savePage(
        { url, title: site, conversation: { site, messages: [messages[1]] } },
        db
      )
      assert.equal(
        (await searchPages({ query: 'CedarQuestion WillowAnswer' }, db)).total,
        1
      )
      assert.equal(
        (await db.contents.toArray())[0].conversation?.messages.length,
        2
      )
      assert.ok(
        (await db.contents.toArray())[0].content.includes(chatSiteNames[site])
      )
      await assert.rejects(
        savePage(
          { url, title: site, conversation: { site: 'chatgpt', messages } },
          db
        )
      )
      await importPages(
        parseBackup(JSON.stringify(await exportBackup(db))),
        () => {},
        restored
      )
      assert.deepEqual((await restored.contents.toArray())[0].conversation, {
        site,
        messages
      })
    } finally {
      await db.delete()
      await restored.delete()
    }
  }
  assert.equal(
    chatConversationUrl('https://gemini.google.com/u/1/app/abc'),
    'https://gemini.google.com/u/1/app/abc'
  )
})

test('messages merge transactionally into one searchable conversation, preserve repeats, update edits and survive backups/reindex', async () => {
  const db = new PageDatabase('chat-' + crypto.randomUUID())
  const restored = new PageDatabase('chat-restore-' + crypto.randomUUID())
  const url = 'https://chatgpt.com/c/test-conversation'
  const save = (messages: ChatMessage[]) =>
    savePage(
      {
        url,
        title: 'ChatGPT · Test',
        conversation: { site: 'chatgpt', messages },
        isBookmarked: true
      },
      db
    )
  try {
    await Promise.all([
      save([{ id: 'a', role: 'assistant', text: 'AnswerWillow', order: 1 }]),
      save([{ id: 'u', role: 'user', text: 'QuestionCedar', order: 0 }])
    ])
    assert.equal(await db.pages.count(), 1)
    const page = (
      await searchPages(
        { query: 'QuestionCedar AnswerWillow', fuzzy: false },
        db
      )
    ).results[0]
    assert.ok(page)
    let content = await db.contents.get(page.id!)
    assert.deepEqual(
      content?.conversation?.messages.map((m) => m.id),
      ['u', 'a']
    )
    await save([{ id: 'u2', role: 'user', text: 'QuestionCedar', order: 2 }])
    await save([
      { id: 'a', role: 'assistant', text: 'RevisedMagnolia', order: 1 }
    ])
    assert.equal(
      (await searchPages({ query: 'AnswerWillow', fuzzy: false }, db)).total,
      0
    )
    content = await db.contents.get(page.id!)
    assert.equal(content?.conversation?.messages.length, 3)
    assert.equal(content?.content.match(/QuestionCedar/g)?.length, 2)
    assert.equal(
      (
        await save([
          { id: 'a', role: 'assistant', text: 'RevisedMagnolia', order: 1 }
        ])
      ).changed,
      false
    )
    const oldBackup = await exportBackup(db)
    await db.pages.update(page.id!, { date: Date.now() + 10000 })
    await save([{ id: 'a', role: 'assistant', text: 'NewestSpruce', order: 1 }])
    await importPages(parseBackup(JSON.stringify(oldBackup)), () => {}, db)
    assert.equal(
      (await db.contents.get(page.id!))?.conversation?.messages[1].text,
      'NewestSpruce'
    )
    await db.pages.update(page.id!, { indexVersion: 0 })
    await reindexBatch(db)
    assert.equal(
      (await db.contents.get(page.id!))?.conversation?.messages.length,
      3
    )
    await importPages(
      parseBackup(JSON.stringify(await exportBackup(db))),
      () => {},
      restored
    )
    assert.equal(
      (await restored.contents.toArray())[0].conversation?.messages.length,
      3
    )
  } finally {
    await db.delete()
    await restored.delete()
  }
})
