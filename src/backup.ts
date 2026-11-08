import Papa from 'papaparse'
import { db, type PageDatabase, savePage } from './database'
import type { PageInput } from './types'
import { normalizeUrl } from './identity'
import { t } from './i18n'
import { readConversation } from './chatgpt-data'
export interface Backup {
  format: 'fulltext-bookmark'
  version: 2
  exportedAt: string
  pages: PageInput[]
}
export async function exportBackup(database = db): Promise<Backup> {
  return database.transaction(
    'r',
    [database.pages, database.contents],
    async () => {
      const pages = await database.pages.toArray()
      const contents = await database.contents.bulkGet(pages.map((p) => p.id!))
      return {
        format: 'fulltext-bookmark',
        version: 2,
        exportedAt: new Date().toISOString(),
        pages: pages.map((page, i) => ({
          url: page.url,
          title: page.title,
          date: page.date,
          pageId: page.pageId,
          isBookmarked: page.isBookmarked,
          source: page.source,
          truncated: page.truncated,
          content: contents[i]?.content || '',
          conversation: contents[i]?.conversation
        }))
      }
    }
  )
}
export function toCSV(backup: Backup): string {
  return (
    '\ufeff' +
    Papa.unparse(
      backup.pages.map((p) => ({
        URL: p.url,
        Title: p.title,
        Date: new Date(p.date || 0).toISOString(),
        Bookmarked: p.isBookmarked ? 'Yes' : 'No',
        Content: p.content || ''
      })),
      { escapeFormulae: true, newline: '\r\n' }
    )
  )
}
function dateValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const date = Date.parse(String(value ?? ''))
  return Number.isFinite(date) ? date : Date.now()
}
export function parseBackup(text: string): PageInput[] {
  const clean = text.replace(/^\ufeff/, '').trim()
  let rows: Record<string, unknown>[]
  if (clean.startsWith('{') || clean.startsWith('[')) {
    const data = JSON.parse(clean)
    if (data.encrypted)
      throw new Error(t('此备份需要密码', 'This backup requires its password'))
    const tables = data.data?.data
    if (Array.isArray(tables) && tables.some((t) => t.tableName === 'pages')) {
      const contents = new Map<number, string>(
        (tables.find((t) => t.tableName === 'contents')?.rows || []).map(
          (c: { pid: number; content: string }) => [c.pid, c.content]
        )
      )
      rows = tables
        .find((t) => t.tableName === 'pages')
        .rows.map((p: { id: number }) => ({
          ...p,
          content: contents.get(p.id) || ''
        }))
    } else rows = Array.isArray(data) ? data : data.pages
    if (!Array.isArray(rows))
      throw new Error(t('无法识别备份格式', 'Unrecognized backup format'))
  } else {
    const csv = Papa.parse<Record<string, string>>(clean, {
      header: true,
      skipEmptyLines: 'greedy'
    })
    if (csv.errors.length || !csv.meta.fields?.includes('URL'))
      throw new Error(t('CSV 格式错误', 'Invalid CSV format'))
    rows = csv.data.map((r) => ({
      url: r.URL,
      title: unescapeFormula(r.Title),
      date: r.Date,
      isBookmarked: /^(yes|true|1)$/i.test(r.Bookmarked),
      content: unescapeFormula(r.Content)
    }))
  }
  // Validate the complete file before importing anything; malformed URLs never become executable links.
  return rows.map((row, i) => {
    if (typeof row.url !== 'string')
      throw new Error(
        t(`第 ${i + 1} 行的网址无效`, `Invalid URL in row ${i + 1}`)
      )
    return {
      url: normalizeUrl(row.url),
      title: typeof row.title === 'string' ? row.title : '',
      content: typeof row.content === 'string' ? row.content : '',
      date: dateValue(row.date),
      pageId: typeof row.pageId === 'string' ? row.pageId : undefined,
      isBookmarked:
        row.isBookmarked === true ||
        row.isBookmarked === 1 ||
        row.isBookmarked === 'true',
      source: 'import',
      conversation: readConversation(row.conversation)
    }
  })
}
function unescapeFormula(value = '') {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value
}
export async function importPages(
  pages: PageInput[],
  progress: (count: number) => void = () => {},
  database: PageDatabase = db
) {
  for (let start = 0; start < pages.length; start += 25) {
    await database.transaction(
      'rw',
      [database.pages, database.contents, database.terms, database.vectors],
      async () => {
        for (const page of pages.slice(start, start + 25)) {
          const existing = await database.pages
            .where('url')
            .equals(page.url)
            .first()
          const old = existing?.id
            ? await database.contents.get(existing.id)
            : undefined
          // A metadata-only/older backup must not replace a newer captured body.
          const newer = existing && existing.date > (page.date || 0)
          await savePage(
            {
              ...page,
              title: newer ? existing.title : page.title,
              isBookmarked: page.isBookmarked || existing?.isBookmarked,
              conversation:
                newer && old?.content ? old.conversation : page.conversation,
              content: newer && old?.content ? old.content : page.content
            },
            database
          )
        }
      }
    )
    progress(Math.min(start + 25, pages.length))
  }
}
function base64(bytes: Uint8Array) {
  let text = ''
  for (let i = 0; i < bytes.length; i += 8192)
    text += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return btoa(text)
}
function bytes(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
}
async function keyFor(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  usage: KeyUsage[]
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    usage
  )
}
export async function encryptBackup(text: string, password: string) {
  if (password.length < 8)
    throw new Error(t('密码至少 8 位', 'Use at least 8 characters'))
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await keyFor(password, salt, ['encrypt']),
    new TextEncoder().encode(text)
  )
  return JSON.stringify({
    format: 'fulltext-bookmark',
    encrypted: true,
    version: 1,
    salt: base64(salt),
    iv: base64(iv),
    data: base64(new Uint8Array(encrypted))
  })
}
export async function decryptBackup(text: string, password: string) {
  const value = JSON.parse(text)
  if (
    value.format !== 'fulltext-bookmark' ||
    value.version !== 1 ||
    !value.encrypted
  )
    throw new Error(t('不支持此加密备份格式', 'Unsupported encrypted backup'))
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes(value.iv) },
      await keyFor(password, bytes(value.salt), ['decrypt']),
      bytes(value.data)
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    throw new Error(
      t('密码错误或备份已损坏', 'Wrong password or damaged backup')
    )
  }
}
