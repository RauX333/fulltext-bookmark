import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderMarkdown } from '../src/markdown'

const render = (text: string) =>
  renderMarkdown(text, 'https://example.com/articles/saved')

test('Markdown supports headings, nested lists, quotes, emphasis and GFM tables/tasks', () => {
  const html = render(
    '# 标题\n\n**加粗**、*斜体*、~~删除~~和 `code`\n\n' +
      '> 引用\n\n1. 有序\n   - 嵌套\n\n- [x] 已完成\n- [ ] 待办\n\n' +
      '| Name | Value |\n| --- | ---: |\n| 中文 | 42 |\n\n---'
  )
  for (const expected of [
    '<h1>标题</h1>',
    '<strong>加粗</strong>',
    '<em>斜体</em>',
    '<s>删除</s>',
    '<code>code</code>',
    '<blockquote>',
    '<ol>',
    '<ul>',
    '<table>',
    '<th style="text-align:right">Value</th>',
    '<td>中文</td>',
    'checked="checked" disabled="disabled"',
    '<hr>'
  ])
    assert.ok(html.includes(expected), expected)
})

test('both ChatGPT-style bracket and dollar math render inline and display formulas', () => {
  for (const text of [String.raw`\(x^2\)`, '$x^2$']) {
    const html = render(text)
    assert.match(html, /class="katex"/)
    assert.doesNotMatch(html, /class="katex-display"/)
  }
  for (const text of [
    String.raw`\[\frac{1}{2}\]`,
    '\\[\n\\frac{1}{2}\n\\]',
    '$$\n\\frac{1}{2}\n$$'
  ]) {
    const html = render(text)
    assert.match(html, /class="katex-display"/)
    assert.match(html, /<math/)
    assert.doesNotMatch(html, /katex-error/)
  }
})

test('code preserves Markdown and math syntax and highlights declared languages', () => {
  const html = render(
    '```js\nconst value = "<script>";\n```\n\n' +
      '```unknown-language\n# literal **text** \\(x\\) $x$\n```\n\n' +
      '`\\[x\\] $x$`\n\n    \\(y\\)\n'
  )
  assert.match(html, /hljs-keyword/)
  assert.match(html, /&lt;script&gt;/)
  assert.ok(html.includes('# literal **text** \\(x\\) $x$'))
  assert.ok(html.includes('<code>\\[x\\] $x$</code>'))
  assert.ok(html.includes('<code>\\(y\\)\n</code>'))
  assert.doesNotMatch(html, /class="katex"/)
})

test('invalid math, escaped delimiters and long unknown code remain readable', () => {
  assert.match(render(String.raw`$\notARealCommand{x}$`), /notARealCommand/)
  const literal = render(String.raw`\$5 and \\(x\\) and unmatched \(x`)
  assert.doesNotMatch(literal, /class="katex"/)
  const large = 'x'.repeat(20001)
  assert.ok(render('```js\n' + large + '\n```').includes(large))
})

test('HTML stays literal and unsafe links, images and trusted TeX commands cannot execute', () => {
  const html = render(
    '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n' +
      '[bad](javascript:alert%281%29)\n\n[bad](vbscript:msgbox%281%29)\n\n' +
      '![bad](data:image/svg+xml;base64,PHN2Zz4=)\n\n' +
      String.raw`$\href{javascript:alert(1)}{click}$ $\includegraphics{https://evil.example/track}$`
  )
  assert.doesNotMatch(
    html,
    /<script|<img|<iframe|href="javascript:|href="vbscript:/
  )
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /&lt;img/)
  assert.doesNotMatch(render('[file](file:///etc/passwd)'), /href="file:/)
  assert.doesNotMatch(
    render('[extension](chrome-extension://abc/options.html)'),
    /href=/
  )
})

test('links and images resolve against the saved source, with safe external navigation', () => {
  const html = render(
    '[relative](../docs) [anchor](#part) [mail](mailto:user@example.com)\n\n' +
      'https://example.org\n\n![image](./image.png)'
  )
  assert.match(html, /href="https:\/\/example.com\/docs"/)
  assert.match(html, /href="https:\/\/example.com\/articles\/saved#part"/)
  assert.match(html, /href="mailto:user@example.com"/)
  assert.match(html, /target="_blank" rel="noopener noreferrer"/)
  assert.match(html, /href="https:\/\/example.org\/"/)
  assert.match(html, /src="https:\/\/example.com\/articles\/image.png"/)
  assert.match(html, /loading="lazy" referrerpolicy="no-referrer"/)
})

test('math macros are isolated between saved messages', () => {
  render(String.raw`$\gdef\privateMacro{secret} \privateMacro$`)
  const html = render(String.raw`$\privateMacro$`)
  assert.doesNotMatch(html, />secret</)
  assert.match(html, /privateMacro/)
})
