import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  savedTextMarkdown,
  savedTextMetadata,
  textExportFilename
} from '../src/text-export'

function readMetadata(markdown: string) {
  const frontMatter = markdown.match(/^---\n([\s\S]*?)\n---\n/)
  assert.ok(frontMatter, 'File must begin with YAML front matter')
  // Each field uses a JSON scalar, a subset of YAML, on its own line.
  return Object.fromEntries(
    frontMatter[1].split('\n').map((line) => {
      const field = line.match(/^(\w+): (.+)$/)
      assert.ok(field, 'Metadata values must not break onto additional lines')
      return [field[1], JSON.parse(field[2])]
    })
  )
}

test('export filenames preserve Unicode and avoid invalid or reserved Windows names', () => {
  assert.equal(
    textExportFilename('中文 / 标题: <测试>? 🌱'),
    '中文 标题 测试 🌱'
  )
  for (const title of ['', '  ... ', 'CON', 'aux.txt', 'LPT9', '\u0000'])
    assert.equal(textExportFilename(title), 'Fulltext-Bookmark', title)
  assert.equal(textExportFilename('article... '), 'article')
  assert.equal(textExportFilename('🌱'.repeat(101)), '🌱'.repeat(100))
})

test('Markdown exports full saved text with title and source, preserving Chinese and line breaks', () => {
  const content =
    '中文正文 café 🌱\r\n第二行\r\n\r\n' + 'long text\n'.repeat(10000) + 'END'
  const markdown = savedTextMarkdown(
    { title: '文章\n标题', url: 'https://example.com/article', content },
    'Partial capture'
  )
  assert.ok(
    markdown.includes('# 文章 标题\n\n<https://example.com/article>\n\n---\n\n')
  )
  assert.ok(markdown.includes('中文正文 café 🌱  \n第二行  \n\n'))
  assert.equal(markdown.match(/long text/g)?.length, 10000)
  assert.ok(markdown.endsWith('END  \n'))
  assert.ok(!markdown.includes('Partial capture'))
})

test('Markdown keeps captured markup literal and identifies partial captures', () => {
  const markdown = savedTextMarkdown(
    {
      title: '*title*',
      url: 'https://example.com/a<b>',
      content:
        '# heading\n![image](https://example.com/image)\n<script>code</script> &copy;\n`code`',
      truncated: true
    },
    'Only saved text is included.'
  )
  assert.ok(markdown.includes('\n# \\*title\\*'))
  assert.ok(markdown.includes('<https://example.com/a%3Cb%3E>'))
  assert.ok(markdown.includes('Only saved text is included\\.'))
  assert.ok(markdown.includes('\\# heading'))
  assert.ok(
    markdown.includes('\\!\\[image\\]\\(https://example\\.com/image\\)')
  )
  assert.ok(markdown.includes('\\<script\\>code\\</script\\> \\&copy;'))
  assert.ok(markdown.includes('\\`code\\`'))
})

test('structured metadata preserves the record time separately from export time in UTC', () => {
  const page = {
    title: '文章：测试',
    url: 'https://example.com/article?q=one&lang=zh',
    content: '正文',
    date: Date.parse('2026-11-07T21:24:35.678+08:00'),
    source: 'page' as const,
    isBookmarked: true,
    truncated: true
  }
  const metadata = readMetadata(
    savedTextMarkdown(
      page,
      'Partial capture',
      new Date('2026-11-08T09:00:00+08:00')
    )
  )
  assert.deepEqual(metadata, {
    title: page.title,
    url: page.url,
    saved_at: '2026-11-07T13:24:35.678Z',
    exported_at: '2026-11-08T01:00:00.000Z',
    source: 'page',
    is_bookmarked: true,
    truncated: true
  })
})

test('metadata safely quotes multiline titles, YAML punctuation and Unicode line separators', () => {
  const page = {
    title: '标题: "引号"\\路径\n---\nurl: false\n\u0085\u2028\u2029',
    url: 'https://example.com/article?title="quoted"&tag=#value',
    content: '正文',
    isBookmarked: false
  }
  const metadata = readMetadata(savedTextMarkdown(page, 'Partial capture'))
  assert.equal(metadata.title, page.title)
  assert.equal(metadata.url, page.url)
  assert.equal(metadata.is_bookmarked, false)
  assert.equal(metadata.truncated, false)
})

test('unknown or invalid saved times stay null; Unix epoch zero is a valid saved time', () => {
  const page = { title: 'Legacy', url: 'https://example.com/', content: 'text' }
  for (const date of [undefined, NaN, Infinity, -Infinity, 1e20]) {
    const metadata = readMetadata(savedTextMarkdown({ ...page, date }, ''))
    assert.equal(metadata.saved_at, null)
    assert.equal(metadata.source, null)
    assert.equal(metadata.is_bookmarked, null)
    assert.equal(typeof metadata.exported_at, 'string')
  }
  assert.equal(
    savedTextMetadata({ ...page, date: 0 }).saved_at,
    '1970-01-01T00:00:00.000Z'
  )
})
