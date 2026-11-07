import { Highlight } from './Highlight'
import Dexie from 'dexie'
import React, { useEffect, useRef, useState } from 'react'
import { send } from './messaging'
import { defaults, migrateSettings, type Settings } from './settings'
import type { SearchRequest, SearchResponse, SearchResult } from './types'
import { db } from './database'
import { t, setLanguage } from './i18n'
import './style.css'
import icon from 'data-base64:../assets/icon512.png'

export function SearchView({
  popup = false,
  sidepanel = false
}: {
  popup?: boolean
  sidepanel?: boolean
}) {
  const compact = popup || sidepanel
  const [windowId, setWindowId] = useState<number>()
  useEffect(() => {
    void chrome.windows.getCurrent().then((w) => setWindowId(w.id))
  }, [])
  const [settings, setSettings] = useState<Settings>(defaults)
  const [query, setQuery] = useState(
    new URLSearchParams(location.search).get('q') || ''
  )
  const [field, setField] = useState<SearchRequest['field']>('all')
  const [source, setSource] = useState<SearchRequest['source']>('all')
  const [sort, setSort] = useState<SearchRequest['sort']>('relevance')
  const [fuzzy, setFuzzy] = useState(true),
    [composition, setComposition] = useState(false)
  const [response, setResponse] = useState<SearchResponse>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const [offset, setOffset] = useState(0),
    [refresh, setRefresh] = useState(0),
    [ready, setReady] = useState(false)
  const [preview, setPreview] = useState<{ title: string; content: string }>()
  const sequence = useRef(0),
    resultList = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    document.documentElement.lang = chrome.i18n.getUILanguage()
    document.title = t('全文书签 · 搜索', 'Fulltext Bookmark · Search')
    document.body.classList.toggle('popup', popup)
    document.body.classList.toggle('sidepanel', sidepanel)
    void send<{ settings: Settings }>('settings')
      .then(({ settings: next }) => {
        setLanguage(next.language)
        document.documentElement.lang =
          next.language === 'auto' ? chrome.i18n.getUILanguage() : next.language
        document.title = t('全文书签 · 搜索', 'Fulltext Bookmark · Search')
        setSettings(next)
        setFuzzy(next.fuzzySearch)
        if (next.showOnlyBookmarkedResults) setSource('bookmarks')
        setReady(true)
      })
      .catch((e) => setError(String(e)))
    input.current?.focus()
  }, [])
  useEffect(() => {
    setOffset(0)
  }, [query, field, source, sort, fuzzy])
  useEffect(() => {
    const current = ++sequence.current
    if (composition || !ready) return
    setBusy(true)
    setError('')
    const timeout = window.setTimeout(
      () => {
        void send<SearchResponse>('search', {
          request: {
            query,
            field,
            source,
            sort,
            fuzzy,
            limit: settings.maxResults,
            offset
          }
        })
          .then((data) => {
            if (current === sequence.current) {
              setResponse(data)
              setBusy(false)
            }
          })
          .catch((e) => {
            if (current === sequence.current) {
              setError(String(e))
              setResponse(undefined)
              setBusy(false)
            }
          })
      },
      query ? 160 : 0
    )
    return () => {
      clearTimeout(timeout)
      sequence.current++
    }
  }, [query, field, source, sort, fuzzy, composition, ready, offset, refresh])
  useEffect(() => {
    const apply = (value: Settings) => {
      setLanguage(value.language)
      document.title = t('全文书签 · 搜索', 'Fulltext Bookmark · Search')
      setSettings(value)
      document.documentElement.lang =
        value.language === 'auto' ? chrome.i18n.getUILanguage() : value.language
    }
    const applyDraft = (value: unknown) => {
      const draft = value as { query?: unknown }
      if (typeof draft?.query === 'string') setQuery(draft.query)
    }
    const changed = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === 'local' && changes['settings.v2']?.newValue)
        apply(migrateSettings(changes['settings.v2'].newValue))
      if (sidepanel && area === 'session' && changes.sidepanelQuery?.newValue)
        applyDraft(changes.sidepanelQuery.newValue)
    }
    chrome.storage.onChanged.addListener(changed)
    if (sidepanel)
      void chrome.storage.session.get('sidepanelQuery').then((v) => {
        if (v.sidepanelQuery) applyDraft(v.sidepanelQuery)
      })
    return () => chrome.storage.onChanged.removeListener(changed)
  }, [])
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const changed = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => setRefresh((n) => n + 1), 300)
    }
    Dexie.on('storagemutated', changed)
    return () => {
      clearTimeout(timeout)
      Dexie.on.storagemutated.unsubscribe(changed)
    }
  }, [])
  const openPanel = () => {
    if (windowId === undefined) return
    void chrome.storage.session.set({
      sidepanelQuery: { query, time: Date.now() }
    })
    // Keep open() directly within the user gesture; don't await storage first.
    void chrome.sidePanel.open({ windowId }).catch((e) => setError(String(e)))
  }
  const openPopup = () => {
    void send('open-popup', { query, windowId }).catch((e) =>
      setError(String(e))
    )
  }
  const openTab = () => {
    void chrome.tabs.create({
      url: chrome.runtime.getURL(
        `tabs/search.html?q=${encodeURIComponent(query)}`
      )
    })
  }
  const switchTab = (result: SearchResult) => {
    void send('switch-tab', { tabId: result.tabId }).catch((e) =>
      setError(String(e))
    )
  }
  const viewText = async (result: SearchResult) => {
    const content = result.id ? await db.contents.get(result.id) : undefined
    setPreview({
      title: result.title,
      content:
        content?.content ||
        t(
          '此条目只有标题和网址；打开网页后会保存正文。',
          'Only the title and URL are available. Visit the page to capture its text.'
        )
    })
  }
  return (
    <main className={compact ? 'search-shell compact' : 'search-shell'}>
      <header className="app-header">
        <div className="brand">
          {!compact && <img className="brand-icon" src={icon} alt="" />}
          <strong>
            {compact ? t('搜索', 'Search') : t('全文书签', 'Fulltext Bookmark')}
          </strong>
        </div>
        <div className="header-actions">
          {!sidepanel && typeof chrome.sidePanel?.open === 'function' && (
            <button
              className="open-search-panel"
              onClick={openPanel}
              disabled={windowId === undefined}
              aria-label={t('在侧边栏中搜索', 'Search in a side panel')}
              title={t('在侧边栏中搜索', 'Search in a side panel')}
            >
              {t('侧边栏', 'Side panel')}
            </button>
          )}
          {!popup && (
            <button
              className="open-search-popup"
              onClick={openPopup}
              aria-label={t('在 popup 中搜索', 'Search in a popup')}
              title={t('在 popup 中搜索', 'Search in a popup')}
            >
              Popup
            </button>
          )}
          {compact && (
            <button
              className="open-search-tab"
              onClick={openTab}
              aria-label={t('在标签页中搜索', 'Search in a tab')}
              title={t('在标签页中搜索', 'Search in a tab')}
            >
              {t('在标签页中搜索', 'Search in a tab')}
            </button>
          )}
          <button onClick={() => void chrome.runtime.openOptionsPage()}>
            {t('设置', 'Settings')}
          </button>
        </div>
      </header>
      <section
        className="search-controls"
        aria-label={t('搜索设置', 'Search controls')}
      >
        <div className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            ref={input}
            type="search"
            aria-label={t('搜索已保存的网页', 'Search saved pages')}
            placeholder={t('搜索文字', 'Search text')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onCompositionStart={() => setComposition(true)}
            onCompositionEnd={(e) => {
              setQuery(e.currentTarget.value)
              setComposition(false)
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                resultList.current
                  ?.querySelector<HTMLAnchorElement>('a')
                  ?.focus()
              }
              if (e.key === 'Enter') setRefresh((n) => n + 1)
            }}
          />
        </div>
        <div className="source-tabs" aria-label={t('内容来源', 'Source')}>
          {(
            [
              ['all', t('全部记录', 'All pages')],
              ['bookmarks', t('书签', 'Bookmarks')],
              ['tabs', t('打开的标签页', 'Open tabs')]
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              aria-pressed={source === value}
              onClick={() => setSource(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="filters">
          <label>
            {t('范围', 'In')}
            <select
              value={field}
              onChange={(e) =>
                setField(e.target.value as SearchRequest['field'])
              }
            >
              <option value="all">
                {t('标题 + 正文 + 网址', 'Title, text & URL')}
              </option>
              <option value="title">{t('仅标题', 'Title')}</option>
              <option value="content">{t('仅正文', 'Text')}</option>
              <option value="url">{t('仅网址', 'URL')}</option>
            </select>
          </label>
          <label>
            {t('排序', 'Sort')}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SearchRequest['sort'])}
            >
              <option value="relevance">{t('相关度', 'Relevance')}</option>
              <option value="recent">{t('最近访问', 'Newest')}</option>
              <option value="oldest">{t('最早访问', 'Oldest')}</option>
            </select>
          </label>
          <label
            className="check"
            title={t(
              '匹配英文单字符错字和相邻字母颠倒；中文分词、简繁和缩写匹配始终启用。',
              'Match one-character English typos and transpositions. Chinese segmentation, traditional/simplified forms and abbreviations are always supported.'
            )}
          >
            <input
              type="checkbox"
              checked={fuzzy}
              onChange={(e) => setFuzzy(e.target.checked)}
            />
            {t('模糊搜索', 'Fuzzy search')}
          </label>
        </div>
      </section>
      <div className="result-status" role="status" aria-live="polite">
        {busy
          ? t('正在搜索…', 'Searching…')
          : response
            ? `${response.total}${response.limited ? '+' : ''} ${t('条记录', 'results')} · ${Math.round(response.elapsed)} ms`
            : t('正在加载…', 'Loading…')}
        {!query && !busy && <span>{t('最近保存', 'Recently saved')}</span>}
      </div>
      {response?.partial && (
        <p className="notice">
          {t(
            '未找到包含全部关键词的页面，以下结果匹配了多数关键词。',
            'No pages match every keyword. Showing pages matching most keywords.'
          )}
        </p>
      )}
      {response?.limited && (
        <p className="notice">
          {t(
            '匹配较多，请增加关键词缩小范围。',
            'Many pages match. Add keywords to narrow your search.'
          )}
        </p>
      )}
      {!!response?.indexing && (
        <p className="notice">
          {t(
            `正在升级旧数据索引，剩余 ${response.indexing} 条。原文保留，稍后刷新即可。`,
            `Updating the legacy index: ${response.indexing} remaining. Original text is preserved; refresh shortly.`
          )}{' '}
          <button onClick={() => setRefresh((n) => n + 1)}>
            {t('刷新', 'Refresh')}
          </button>
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
          <button onClick={() => setRefresh((n) => n + 1)}>
            {t('重试', 'Retry')}
          </button>
        </p>
      )}
      <div
        ref={resultList}
        className="results"
        aria-busy={busy}
        onKeyDown={(e) => {
          if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return
          const links = [
            ...(resultList.current?.querySelectorAll<HTMLAnchorElement>(
              'a.result-title'
            ) || [])
          ]
          const index = links.indexOf(
            document.activeElement as HTMLAnchorElement
          )
          const next = links[index + (e.key === 'ArrowDown' ? 1 : -1)]
          if (next) {
            e.preventDefault()
            next.focus()
          }
        }}
      >
        {!busy && response?.results.length === 0 && (
          <div className="empty">
            <span aria-hidden="true">⌕</span>
            <h2>{t('还没有找到内容', 'No pages found')}</h2>
            <p>
              {query
                ? t(
                    '试试更短的关键词、开启容错，或切换搜索范围。完整短语可加英文双引号。',
                    'Try fewer keywords, enable fuzzy matching or change the field. Use double quotes for an exact phrase.'
                  )
                : t(
                    '浏览网页后，内容会自动保存并建立索引。设置中也可以导入已有历史记录的标题和网址。',
                    'Browse a page to save and index its text. You can also import existing history titles and URLs in Settings.'
                  )}
            </p>
          </div>
        )}
        {response?.results.map((result) => (
          <article
            className="result-card"
            key={result.tabId ? `tab-${result.tabId}` : result.id}
          >
            <div className="result-heading">
              <a
                className="result-title"
                href={result.url}
                target="_blank"
                rel="noreferrer"
                onClick={
                  result.tabId
                    ? (e) => {
                        e.preventDefault()
                        switchTab(result)
                      }
                    : undefined
                }
              >
                <Highlight
                  text={result.title || result.url}
                  terms={result.matched}
                />
              </a>
              {result.isBookmarked && (
                <span className="bookmark" title={t('书签', 'Bookmark')}>
                  ★
                </span>
              )}
            </div>
            <div className="result-url" title={result.url}>
              {result.url}
            </div>
            {result.snippet && (
              <p className="snippet">
                <Highlight text={result.snippet} terms={result.matched} />
              </p>
            )}
            <div className="result-meta">
              <time>{new Date(result.date).toLocaleDateString()}</time>
              {result.truncated && (
                <span>
                  {t(
                    '超长页面 · 已保存部分文字',
                    'Very long page · partial capture'
                  )}
                </span>
              )}
              {result.tabId ? (
                <button onClick={() => switchTab(result)}>
                  {t('切换到标签页', 'Switch to tab')}
                </button>
              ) : (
                <button
                  onClick={() =>
                    void viewText(result).catch((e) => setError(String(e)))
                  }
                >
                  {t('查看保存的文字', 'Read saved text')}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {response &&
        source !== 'tabs' &&
        response.total > settings.maxResults && (
          <nav
            className="pagination"
            aria-label={t('结果分页', 'Result pages')}
          >
            <button
              aria-label={t('上一页', 'Previous')}
              title={t('上一页', 'Previous')}
              disabled={!offset}
              onClick={() =>
                setOffset(Math.max(0, offset - settings.maxResults))
              }
            >
              {popup ? '←' : t('上一页', 'Previous')}
            </button>
            <span>
              {offset + 1}–
              {Math.min(offset + settings.maxResults, response.total)}
            </span>
            <button
              aria-label={t('下一页', 'Next')}
              title={t('下一页', 'Next')}
              disabled={offset + settings.maxResults >= response.total}
              onClick={() => setOffset(offset + settings.maxResults)}
            >
              {popup ? '→' : t('下一页', 'Next')}
            </button>
          </nav>
        )}
      <footer className="search-footer">
        <span>{t('↑ ↓ 选择 · Enter 打开', '↑ ↓ Navigate · Enter Open')}</span>
      </footer>
      {preview && (
        <div className="modal-backdrop" onClick={() => setPreview(undefined)}>
          <section
            className="text-preview"
            role="dialog"
            aria-modal="true"
            aria-label={preview.title}
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h2>{preview.title}</h2>
              <button
                autoFocus
                onClick={() => setPreview(undefined)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setPreview(undefined)
                }}
              >
                {t('关闭', 'Close')}
              </button>
            </header>
            <pre>{preview.content}</pre>
          </section>
        </div>
      )}
    </main>
  )
}
