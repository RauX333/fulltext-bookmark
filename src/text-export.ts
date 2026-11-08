import type { ChatConversation } from './chatgpt-data'
import type { PageRecord } from './types'

export interface SavedText {
  conversation?: ChatConversation
  title: string
  url: string
  content: string
  date?: number
  source?: PageRecord['source']
  isBookmarked?: boolean
  truncated?: boolean
}

export function savedTextMetadata(page: SavedText, exportedAt = new Date()) {
  const savedTime =
    typeof page.date === 'number' ? new Date(page.date) : undefined
  return {
    title: page.title || page.url,
    url: page.url,
    // The archive stores the latest record time, not a first-capture time.
    // Imported records retain their original timestamp. Never substitute now.
    saved_at:
      savedTime && Number.isFinite(savedTime.getTime())
        ? savedTime.toISOString()
        : null,
    exported_at: exportedAt.toISOString(),
    source: page.source ?? null,
    is_bookmarked: page.isBookmarked ?? null,
    truncated: page.truncated ?? false
  }
}

function yamlValue(value: string | boolean | null) {
  // JSON scalars are also YAML scalars. Quote strings so colons, quotes,
  // newlines and Markdown delimiters cannot change the metadata structure.
  return JSON.stringify(value).replace(
    /[\u007f-\u009f\u2028\u2029]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
  )
}

export function textExportFilename(title: string) {
  const name = Array.from(
    title
      .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  )
    .slice(0, 100)
    .join('')
    .replace(/[. ]+$/, '')
  return !name || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)
    ? 'Fulltext-Bookmark'
    : name
}

// Captured content is plain text, not Markdown or HTML. Keep it literal when
// a Markdown reader renders it, including apparent links, images and tags.
function markdownText(text: string) {
  return text.replace(/[\\`*_{}\[\]<>()#+\-.!|~=>&]/g, '\\$&')
}

export function savedTextMarkdown(
  page: SavedText,
  partialNotice: string,
  exportedAt = new Date()
) {
  const metadata = Object.entries(savedTextMetadata(page, exportedAt))
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join('\n')
  const title = markdownText((page.title || page.url).replace(/\s+/g, ' '))
  const url = page.url.replace(/[<>\s]/g, (char) => encodeURIComponent(char))
  const body = markdownText(page.content.replace(/\r\n?/g, '\n'))
    .split('\n')
    .map((line) => (line ? `${line}  ` : ''))
    .join('\n')
  return `---\n${metadata}\n---\n\n# ${title}\n\n<${url}>\n\n${page.truncated ? `${markdownText(partialNotice)}\n\n` : ''}---\n\n${body}\n`
}

export function downloadMarkdown(page: SavedText, partialNotice: string) {
  const url = URL.createObjectURL(
    new Blob([savedTextMarkdown(page, partialNotice)], {
      type: 'text/markdown;charset=utf-8'
    })
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${textExportFilename(page.title)}.md`
  anchor.hidden = true
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
