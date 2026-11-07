import { t } from './i18n'
export function installSearchCompanion(enabled: () => boolean) {
  if (!/(^|\.)(google\.[a-z.]+|bing\.com|baidu\.com)$/.test(location.hostname))
    return
  let last = '',
    timeout = 0
  const run = async () => {
    if (!enabled()) {
      document.querySelector('[data-ftb-companion]')?.remove()
      return
    }
    const params = new URLSearchParams(location.search)
    const query = params.get('q') || params.get('wd') || params.get('word')
    if (!query || query === last) return
    last = query
    try {
      const response = await chrome.runtime.sendMessage({
        command: 'search-companion',
        query
      })
      if (!response?.ok || !response.result || last !== query) return
      document.querySelector('[data-ftb-companion]')?.remove()
      const container = document.querySelector(
        '#search, #b_results, #content_left'
      )
      if (!container) {
        last = ''
        return
      }
      const box = document.createElement('section')
      box.dataset.ftbOwned = 'true'
      box.dataset.ftbCompanion = 'true'
      box.style.cssText =
        'padding:14px;margin:12px 0;border:1px solid #b8c9d9;border-radius:8px;font:14px/1.5 sans-serif;color:#334155;background:#fff'
      const label = document.createElement('small')
      label.textContent = t(
        '全文书签 · 已保存的页面',
        'Fulltext Bookmark · Saved pages'
      )
      const link = document.createElement('a')
      link.href = response.result.url
      link.textContent = response.result.title
      link.style.cssText = 'display:block;font-size:17px;color:#2456a6'
      const snippet = document.createElement('p')
      snippet.textContent = response.result.snippet
      box.append(label, link, snippet)
      container.prepend(box)
    } catch {
      last = ''
    }
  }
  const observer = new MutationObserver((mutations) => {
    if (
      mutations.every((m) =>
        (m.target instanceof Element
          ? m.target
          : m.target.parentElement
        )?.closest('[data-ftb-owned]')
      )
    )
      return
    clearTimeout(timeout)
    timeout = window.setTimeout(() => void run(), 900)
  })
  observer.observe(document.body, { childList: true, subtree: true })
  void run()
}
