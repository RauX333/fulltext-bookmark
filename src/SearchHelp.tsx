import React, { useEffect, useId, useRef, useState } from 'react'
import { t } from './i18n'
import './search-help.css'

export function SearchHelp() {
  const [open, setOpen] = useState(false)
  const pinned = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const id = useId()
  const close = () => {
    clearTimeout(timer.current)
    pinned.current = false
    setOpen(false)
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close()
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (root.current?.contains(document.activeElement))
        button.current?.focus()
      close()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])
  const examples = [
    [
      'browser history',
      t(
        '关键词：搜索标题、正文和网址。',
        'Keywords: search titles, text and URLs.'
      )
    ],
    [
      '"browser history"',
      t(
        '精确短语：保持词序，关闭该短语的容错、词形和缩写扩展。',
        'Exact phrase: preserve word order, without typos, stemming or aliases.'
      )
    ],
    [
      'brow*',
      t(
        '单词通配符（前缀）：* 匹配零个或多个字符，例如 browser、browsing；不跨空格或单词标点。',
        'Prefix wildcard: * matches zero or more characters, e.g. browser or browsing. It does not cross spaces or word punctuation.'
      )
    ],
    [
      '*script',
      t(
        '单词通配符（后缀）：匹配 JavaScript、TypeScript。',
        'Suffix wildcard: matches JavaScript and TypeScript.'
      )
    ],
    [
      'b*ser',
      t(
        '单词通配符（中间）：匹配 browser；* 也可以放在词中。',
        'Infix wildcard: matches browser; * can appear inside a word.'
      )
    ],
    [
      'br?wser',
      t(
        '单字符通配符：? 只替代一个字符，例如匹配 browser。',
        'Single-character wildcard: ? replaces exactly one character, e.g. browser.'
      )
    ],
    [
      'site:example.com',
      t(
        '限定网站：匹配 example.com 及 docs.example.com 等子域名。',
        'Site: matches example.com and subdomains such as docs.example.com.'
      )
    ],
    [
      'site:*.example.com',
      t(
        '仅子域名：匹配 docs.example.com，不包含 example.com 本身。',
        'Subdomains only: matches docs.example.com, excluding example.com itself.'
      )
    ],
    [
      'site:example.com/docs',
      t(
        '限定网站路径：匹配 /docs 及其下的页面，不包含 /docs-old。',
        'Site path: matches /docs and its descendants, excluding /docs-old.'
      )
    ],
    [
      'url:/docs/',
      t(
        '网址包含匹配：查找网址中含有 /docs/ 的页面。',
        'URL substring: finds pages whose URL contains /docs/.'
      )
    ],
    [
      'url:github.com/*/issues',
      t(
        '网址通配符：例如匹配 github.com/team/project/issues。',
        'URL wildcard: matches URLs such as github.com/team/project/issues.'
      )
    ],
    [
      'inurl:github.com',
      t(
        'inurl: 与 url: 同义；此例匹配网址中包含 github.com 的页面。',
        'inurl: is an alias for url:; this finds URLs containing github.com.'
      )
    ],
    [
      'url:/search?q=browser',
      t(
        '网址查询参数：按字面匹配 ?q=browser，此处 ? 不是通配符。',
        'URL query string: matches the literal ?q=browser; here ? is not a wildcard.'
      )
    ],
    [
      'https://example.com/docs',
      t(
        '直接粘贴网址：自动匹配网址中包含这段地址的页面。',
        'Paste a URL: automatically finds URLs containing this address.'
      )
    ],
    [
      'example.com',
      t(
        '直接输入域名：自动搜索网址；如需严格限定网站边界，使用 site:example.com。',
        'Type a domain: automatically searches URLs. Use site:example.com for strict hostname boundaries.'
      )
    ],
    [
      'intitle:guide',
      t(
        '标题关键词：仅匹配标题中完整的 guide，不匹配 guidebook。',
        'Title word: matches the complete word guide in titles, excluding guidebook.'
      )
    ],
    [
      'intitle:"入门指南"',
      t(
        '标题精确短语：仅匹配标题中连续的“入门指南”。',
        'Title phrase: matches the exact phrase 入门指南 in titles.'
      )
    ],
    [
      'intitle:guid*',
      t(
        '标题通配符：例如匹配标题中的 guide、guidebook。',
        'Title wildcard: matches guide or guidebook in titles.'
      )
    ],
    [
      'intext:browser',
      t(
        '正文关键词：仅匹配保存的正文中的 browser。',
        'Text word: matches browser only in saved page text.'
      )
    ],
    [
      'intext:"全文搜索"',
      t(
        '正文精确短语：仅匹配保存正文中连续的“全文搜索”。打开的标签页没有可搜索的正文。',
        'Text phrase: matches the exact phrase 全文搜索 in saved text. Open tabs have no searchable page body.'
      )
    ],
    [
      'intext:brow*',
      t(
        '正文通配符：例如匹配保存正文中的 browser、browsing。',
        'Text wildcard: matches browser or browsing in saved text.'
      )
    ],
    [
      'browser -mobile',
      t(
        '排除关键词：搜索 browser，但排除含有完整单词 mobile 的页面。',
        'Exclude a word: search for browser, omitting pages containing the word mobile.'
      )
    ],
    [
      'browser -"mobile browser"',
      t(
        '排除短语：排除含有连续短语 mobile browser 的页面。',
        'Exclude a phrase: omit pages containing the exact phrase mobile browser.'
      )
    ],
    [
      'browser -mobil*',
      t(
        '排除通配符：排除含 mobile、mobility 等单词的页面。',
        'Exclude a wildcard: omit pages containing words such as mobile or mobility.'
      )
    ],
    [
      'browser -site:example.com',
      t(
        '排除网站：排除 example.com 及其子域名的页面。',
        'Exclude a site: omit example.com and all its subdomains.'
      )
    ],
    [
      'browser -intitle:archived',
      t(
        '排除标题：排除标题含完整单词 archived 的页面。',
        'Exclude a title match: omit titles containing the word archived.'
      )
    ],
    [
      'browser -intext:mobile',
      t(
        '排除正文：排除保存正文中含完整单词 mobile 的页面。',
        'Exclude a text match: omit pages with the word mobile in saved text.'
      )
    ],
    [
      'browser -url:/archive/',
      t(
        '排除网址：排除网址中包含 /archive/ 的页面。',
        'Exclude a URL match: omit pages whose URL contains /archive/.'
      )
    ],
    [
      '"brow*"',
      t(
        '字面星号：引号内的 * 视为字符本身，匹配文字 brow*。',
        'Literal star: inside quotes, * is a literal character; matches the text brow*.'
      )
    ],
    [
      '"br?wser"',
      t(
        '字面问号：引号内的 ? 视为字符本身，匹配文字 br?wser。',
        'Literal question mark: inside quotes, ? is literal; matches the text br?wser.'
      )
    ],
    [
      'url:"/literal*"',
      t(
        '网址字面星号：匹配网址中实际包含 /literal* 的页面。',
        'Literal URL star: finds URLs that actually contain /literal*.'
      )
    ],
    [
      'site:github.com intitle:read* -archived',
      t(
        '空格组合条件：每个条件都必须满足。',
        'Combine conditions with spaces: every condition must match.'
      )
    ]
  ]
  return (
    <div
      className="search-help"
      ref={root}
      onMouseEnter={() => {
        clearTimeout(timer.current)
        setOpen(true)
      }}
      onMouseLeave={() => {
        if (!pinned.current && !root.current?.contains(document.activeElement))
          timer.current = setTimeout(() => setOpen(false), 180)
      }}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget)) close()
      }}
    >
      <button
        ref={button}
        type="button"
        className="search-help-button"
        aria-label={t('搜索使用说明', 'Search help')}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-haspopup="dialog"
        onClick={() => {
          clearTimeout(timer.current)
          pinned.current = !pinned.current
          setOpen(pinned.current)
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path
            d="M9.5 9a2.5 2.5 0 0 1 5 .3c0 1.7-2.5 1.9-2.5 3.7"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {open && (
        <section
          id={id}
          role="dialog"
          aria-label={t('搜索使用说明', 'Search help')}
          className="search-help-panel"
          tabIndex={0}
        >
          <div className="search-help-heading">
            <h2>{t('搜索使用说明', 'Search help')}</h2>
            <button
              type="button"
              aria-label={t('关闭搜索说明', 'Close search help')}
              onClick={() => {
                button.current?.focus()
                close()
              }}
            >
              ×
            </button>
          </div>
          <p>
            {t(
              '用下面的写法快速缩小搜索范围。',
              'Use these shortcuts to narrow your search.'
            )}
          </p>
          <dl>
            {examples.map(([example, description]) => (
              <div key={example}>
                <dt>
                  <span className="search-help-example-label">
                    {t('例：', 'Example: ')}
                  </span>
                  <code>{example}</code>
                </dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
          <p className="search-help-note">
            {t(
              '不区分大小写，保留简繁与重音归一化。引号内的 * 和 ? 按字面匹配。带操作符的条件优先于“范围”选项；使用这些语法时不会退回到只匹配部分关键词。点击问号可固定说明，按 Esc 或点击外部关闭。',
              'Case-insensitive; Chinese forms and accents are normalized. Inside quotes, * and ? are literal. Field operators override the In selector. Queries using this syntax never fall back to partial keyword matches. Click ? to pin this guide; press Esc or click outside to close.'
            )}
          </p>
        </section>
      )}
    </div>
  )
}
