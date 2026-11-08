import MarkdownIt from 'markdown-it'
import { katex } from '@mdit/plugin-katex'
import { tasklist } from '@mdit/plugin-tasklist'
import hljs from 'highlight.js/lib/common'

// Keep source HTML literal. Only our bundled plugins may produce HTML, and the
// preview sanitizes their final output before inserting it into the document.
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  highlight(code, language) {
    // Unknown languages and very large blocks remain readable escaped code.
    if (code.length > 20000 || !language || !hljs.getLanguage(language))
      return ''
    return hljs.highlight(code, { language, ignoreIllegals: true }).value
  }
})
  .use(tasklist, { disabled: true, label: false })
  .use(katex, {
    delimiters: 'all',
    throwOnError: false,
    trust: false,
    maxExpand: 1000,
    maxSize: 20,
    logger: () => 'ignore' as const
  })

function resolveUrl(raw: string, sourceUrl: string, image = false) {
  try {
    const url = new URL(raw, sourceUrl)
    if (
      ['http:', 'https:'].includes(url.protocol) ||
      (!image && url.protocol === 'mailto:')
    )
      return url.href
  } catch {
    // Malformed/unsupported URLs must not resolve against an extension page.
  }
  return ''
}

markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
  const token = tokens[index]
  const href = resolveUrl(
    String(token.attrGet('href') || ''),
    String(env?.sourceUrl || '')
  )
  if (href) token.attrSet('href', href)
  else token.attrs = token.attrs?.filter(([name]) => name !== 'href') || null
  token.attrSet('target', '_blank')
  token.attrSet('rel', 'noopener noreferrer')
  return renderer.renderToken(tokens, index, options)
}

const renderImage = markdown.renderer.rules.image!
markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
  const token = tokens[index]
  const src = resolveUrl(
    String(token.attrGet('src') || ''),
    String(env?.sourceUrl || ''),
    true
  )
  if (!src) return markdown.utils.escapeHtml(token.content)
  token.attrSet('src', src)
  token.attrSet('loading', 'lazy')
  token.attrSet('referrerpolicy', 'no-referrer')
  return renderImage(tokens, index, options, env, renderer)
}

// Wrappers let wide tables scroll without pushing the modal beyond the screen.
markdown.renderer.rules.table_open = () =>
  '<div class="markdown-table"><table>\n'
markdown.renderer.rules.table_close = () => '</table></div>\n'

export function renderMarkdown(text: string, sourceUrl: string) {
  return markdown.render(text, { sourceUrl })
}
