import Dexie, { type Table } from 'dexie'
import type { PageRecord, ContentRecord, PageInput } from './types'
import {
  chatConversationUrl,
  mergeConversation,
  readConversation
} from './chatgpt-data'
import { indexWords, deletions, hashText, normalizeUrl } from './text'
import { mergeArticleSnapshot } from './captured-snapshot'
export const INDEX_VERSION = 3
export const MAX_CONTENT_LENGTH = 1_000_000
interface TermRecord {
  term: string
  deletes: string[]
  refs: number
}
export class PageDatabase extends Dexie {
  pages!: Table<PageRecord, number>
  contents!: Table<ContentRecord, number>
  vectors!: Table<{ id?: number; pid: number; [key: string]: unknown }, number>
  terms!: Table<TermRecord, string>
  meta!: Table<{ key: string; value: unknown }, string>
  constructor(name = 'PageDatabase') {
    super(name)
    this.version(1).stores({
      pages: '++id,url,title,date,pageId,isBookmarked',
      contents: '&pid,*contentWords,*titleWords,content',
      vectors: '++id,pid,serial'
    })
    this.version(2)
      .stores({
        pages: '++id,url,title,date,pageId,isBookmarked,indexVersion',
        contents: '&pid,*contentWords,*titleWords,*urlWords',
        terms: '&term,*deletes',
        meta: '&key'
      })
      .upgrade(async (tx) => {
        await tx.table('pages').toCollection().modify({ indexVersion: 0 })
        // An upgrade never expires old records immediately. Give the user a full
        // day to inspect the upgraded archive before their retention rule resumes.
        await tx
          .table('meta')
          .put({ key: 'retentionResumeAt', value: Date.now() + 86400000 })
      })
  }
}
export const db = new PageDatabase()
function dictionaryWords(record?: ContentRecord) {
  return new Set(
    [
      ...(record?.contentWords ?? []),
      ...(record?.titleWords ?? []),
      ...(record?.urlWords ?? [])
    ].filter((t) => /^[a-z]{4,32}$/.test(t))
  )
}
async function updateDictionary(
  database: PageDatabase,
  old: ContentRecord | undefined,
  next?: ContentRecord
) {
  const before = dictionaryWords(old),
    after = dictionaryWords(next)
  const added = [...after].filter((t) => !before.has(t)),
    removed = [...before].filter((t) => !after.has(t))
  const all = [...added, ...removed],
    current = await database.terms.bulkGet(all)
  const put: TermRecord[] = [],
    drop: string[] = []
  all.forEach((term, i) => {
    const refs = (current[i]?.refs ?? 0) + (i < added.length ? 1 : -1)
    if (refs > 0)
      put.push({ term, deletes: current[i]?.deletes ?? deletions(term), refs })
    else drop.push(term)
  })
  await database.terms.bulkPut(put)
  await database.terms.bulkDelete(drop)
}
export async function savePage(
  input: PageInput,
  database = db
): Promise<{ id: number; changed: boolean }> {
  const url = normalizeUrl(input.url)
  const conversation = readConversation(input.conversation)
  if (
    input.conversation &&
    (!conversation || !chatConversationUrl(url, conversation.site))
  )
    throw new Error('Invalid chat conversation')
  const title = (typeof input.title === 'string' ? input.title : '').slice(
    0,
    4000
  )
  const content =
    typeof input.content === 'string'
      ? input.source === 'import'
        ? input.content
        : input.content.slice(0, MAX_CONTENT_LENGTH)
      : undefined
  // Await the entire transaction: success must mean the archive is durable.
  return database.transaction(
    'rw',
    [database.pages, database.contents, database.terms, database.vectors],
    async () => {
      const existing = await database.pages.where('url').equals(url).first()
      const old = existing?.id
        ? await database.contents.get(existing.id)
        : undefined
      const merged =
        input.mergeContent &&
        content &&
        old?.content &&
        existing?.captureProfile === input.captureProfile
          ? input.captureProfile
            ? mergeArticleSnapshot(
                old.content,
                content,
                Math.max(MAX_CONTENT_LENGTH, old.content.length)
              )
            : mergeCapturedText(old.content, content)
          : undefined
      const chat = conversation
        ? mergeConversation(old?.conversation, conversation)
        : undefined
      const nextText =
        chat?.content || merged?.text || content || old?.content || ''
      const nextTitle = title || existing?.title || url
      const contentHash = hashText(nextText),
        titleHash = hashText(nextTitle)
      const changed =
        !existing ||
        existing.contentHash !== contentHash ||
        existing.titleHash !== titleHash ||
        (!!chat &&
          JSON.stringify(chat.conversation) !==
            JSON.stringify(old?.conversation)) ||
        existing.indexVersion !== INDEX_VERSION
      const page: PageRecord = {
        ...existing,
        url,
        title: nextTitle,
        date: Math.max(
          existing?.date ?? 0,
          Number.isFinite(input.date) ? input.date! : Date.now()
        ),
        pageId: existing?.pageId || input.pageId || crypto.randomUUID(),
        isBookmarked: input.isBookmarked ?? !!existing?.isBookmarked,
        indexVersion: INDEX_VERSION,
        contentHash,
        titleHash,
        source: content ? 'page' : existing?.source || input.source || 'page',
        captureProfile: content
          ? input.captureProfile
          : existing?.captureProfile,
        truncated:
          chat?.truncated ||
          merged?.truncated ||
          (input.truncated ?? existing?.truncated ?? false)
      }
      const id = await database.pages.put(page)
      if (changed) {
        const next: ContentRecord = {
          pid: id,
          content: nextText,
          conversation:
            chat?.conversation ||
            (content && content !== old?.content
              ? undefined
              : old?.conversation),
          contentWords:
            old && existing?.contentHash === contentHash
              ? old.contentWords
              : indexWords(nextText),
          titleWords: indexWords(nextTitle),
          urlWords: indexWords(safeDecode(url))
        }
        // Legacy tokens have never contributed to the v2 dictionary.
        await updateDictionary(
          database,
          existing?.indexVersion === INDEX_VERSION ? old : undefined,
          next
        )
        await database.contents.put(next)
        await database.vectors.where('pid').equals(id).delete()
      }
      return { id, changed }
    }
  )
}
export async function reindexBatch(database = db, batchSize = 25) {
  const pending = await database.pages
    .where('indexVersion')
    .below(INDEX_VERSION)
    .limit(batchSize)
    .toArray()
  for (const page of pending) {
    // Re-read under the same write transaction, so an intervening capture is never overwritten.
    await database.transaction(
      'rw',
      [database.pages, database.contents, database.terms, database.vectors],
      async () => {
        const current = await database.pages.get(page.id!)
        if (!current || current.indexVersion === INDEX_VERSION) return
        const content = await database.contents.get(page.id!)
        // Index by the original primary key, including duplicate/unsupported legacy URLs.
        // Never normalize, merge, truncate or delete original data during a migration.
        const next: ContentRecord = {
          pid: current.id!,
          content: content?.content || '',
          conversation: content?.conversation,
          contentWords: indexWords(content?.content || ''),
          titleWords: indexWords(current.title || ''),
          urlWords: indexWords(safeDecode(current.url || ''))
        }
        await updateDictionary(
          database,
          current.indexVersion ? content : undefined,
          next
        )
        await database.contents.put(next)
        await database.pages.update(current.id!, {
          indexVersion: INDEX_VERSION,
          contentHash: hashText(next.content),
          titleHash: hashText(current.title || '')
        })
      }
    )
  }
  return database.pages.where('indexVersion').below(INDEX_VERSION).count()
}
function safeDecode(url: string) {
  try {
    return decodeURI(url)
  } catch {
    return url
  }
}
export async function deletePages(ids: number[], database = db) {
  await database.transaction(
    'rw',
    [database.pages, database.contents, database.terms, database.vectors],
    async () => {
      for (const id of ids) {
        const page = await database.pages.get(id),
          content = await database.contents.get(id)
        if (page?.indexVersion === INDEX_VERSION)
          await updateDictionary(database, content)
      }
      await database.pages.bulkDelete(ids)
      await database.contents.bulkDelete(ids)
      await database.vectors.where('pid').anyOf(ids).delete()
    }
  )
}
export async function expirePages(retentionMs: number, database = db) {
  if (!retentionMs) return 0
  const ids = await database.pages
    .where('date')
    .below(Date.now() - retentionMs)
    .filter((p) => !p.isBookmarked)
    .primaryKeys()
  for (let i = 0; i < ids.length; i += 100)
    await deletePages(ids.slice(i, i + 100), database)
  return ids.length
}

// Browsing the same URL again must not erase comments or virtualized blocks that
// were captured on a previous visit but have not been loaded in the new DOM yet.
function mergeCapturedText(previous: string, incoming: string) {
  if (previous.includes(incoming)) return { text: previous, truncated: false }
  if (incoming.includes(previous)) return { text: incoming, truncated: false }
  const known = new Set(previous.split('\n').map((line) => line.trim()))
  const added: string[] = []
  let size = previous.length,
    truncated = false
  const limit = Math.max(MAX_CONTENT_LENGTH, previous.length)
  for (const line of incoming.split('\n')) {
    if (!line.trim() || known.has(line.trim())) continue
    if (size + line.length + 1 > limit) {
      truncated = true
      break
    }
    known.add(line.trim())
    added.push(line)
    size += line.length + 1
  }
  return { text: [previous, ...added].join('\n'), truncated }
}
