import { extractVisibleText } from './capture'
import { t } from './i18n'
import icon from 'data-base64:../assets/icon512.png'

function setButtonLabel(button: HTMLButtonElement, text: string) {
  if (!button.querySelector('img')) {
    const image = document.createElement('img')
    image.src = icon
    image.alt = 'Fulltext Bookmark'
    image.width = 20
    image.height = 20
    image.style.cssText =
      'width:20px;height:20px;object-fit:contain;vertical-align:middle'
    const label = document.createElement('span')
    button.replaceChildren(image, label)
  }
  button.querySelector('span')!.textContent = text
}
export function weiboPermalink(card: Element): string | undefined {
  // Prefer the timestamp permalink, never the author's profile or a hashtag link.
  const links = [...card.querySelectorAll<HTMLAnchorElement>('a[href]')]
  const ordered = [
    ...links.filter(
      (a) => /time|date|from/.test(a.className) || a.querySelector('time')
    ),
    ...links
  ]
  for (const link of ordered) {
    try {
      const url = new URL(link.href)
      if (!/(^|\.)weibo\.(com|cn)$/.test(url.hostname)) continue
      if (/^\/(?:\d{5,}\/\w{5,}|detail\/\d+|status\/\w+)$/.test(url.pathname)) {
        url.search = ''
        url.hash = ''
        return url.href
      }
    } catch {
      /* unusable link */
    }
  }
}
export function findWeiboCards(root: ParentNode = document): Element[] {
  const candidates = [
    ...root.querySelectorAll(
      'article, [data-mid], [mid], div[class*="Feed_body"], div[class*="vue-recycle-scroller__item-view"], .card-wrap[action-type="feed_list_item"], .card'
    )
  ]
  return candidates.filter(
    (card) =>
      weiboPermalink(card) &&
      !candidates.some(
        (child) =>
          child !== card && card.contains(child) && weiboPermalink(child)
      )
  )
}
export async function readWeiboCard(card: Element) {
  const url = weiboPermalink(card)
  if (!url)
    throw new Error(t('未找到微博正文链接', 'Cannot find a post permalink'))
  // Re-read on click: recycled cards and expanded long posts must not use stale closures.
  const selectors =
    '[node-type="feed_list_content_full"], [node-type="feed_list_content"], [class*="detail_wbtext"], .wbpro-feed-content, .wbpro-feed-reText, .weibo-text, .txt'
  const candidates = [...card.querySelectorAll(selectors)]
  const bodies = candidates.filter(
    (node) =>
      !candidates.some((parent) => parent !== node && parent.contains(node))
  )
  const captures = await Promise.all(
    (bodies.length ? bodies : [card]).map((body) => extractVisibleText(body))
  )
  const text = captures
    .map((c) => c.text)
    .filter(Boolean)
    .join('\n')
  const author =
    card
      .querySelector(
        'a[class*="head_name"], a[class*="head-info_name"], a[class*="_name_"], [node-type="feed_list_originNick"], .m-text-cut'
      )
      ?.textContent?.trim() || ''
  return {
    url,
    title: `${author ? '@' + author + ': ' : ''}${text.slice(0, 120)}`,
    content: text,
    date: Date.now(),
    truncated: captures.some((c) => c.truncated)
  }
}
export function installWeiboButtons(enabled: () => boolean) {
  if (!/(^|\.)weibo\.(com|cn)$/.test(location.hostname)) return () => {}
  let scheduled = 0
  const refresh = () => {
    scheduled = 0
    if (!enabled()) {
      document
        .querySelectorAll('[data-ftb-weibo]')
        .forEach((button) => button.remove())
      return
    }
    for (const card of findWeiboCards()) {
      const url = weiboPermalink(card)!
      const existing = card.querySelector<HTMLButtonElement>('[data-ftb-weibo]')
      if (existing) {
        if (existing.dataset.url !== url) {
          existing.dataset.url = url
          setButtonLabel(existing, t('保存全文', 'Save full text'))
          existing.disabled = false
        }
        continue
      }
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.ftbOwned = 'true'
      button.dataset.ftbWeibo = 'true'
      button.dataset.url = url
      setButtonLabel(button, t('保存全文', 'Save full text'))
      button.title = t(
        'Fulltext Bookmark：保存已加载的微博文字；长微博请先展开',
        'Fulltext Bookmark: save the loaded post. Expand long posts before saving.'
      )
      button.style.cssText =
        'display:inline-flex;align-items:center;gap:5px;margin:6px;padding:3px 7px;border:1px solid #e5e7eb;border-radius:5px;background:#fff;color:#6b7280;font:12px sans-serif;cursor:pointer;position:relative;z-index:1'
      button.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        button.disabled = true
        setButtonLabel(button, t('保存中…', 'Saving…'))
        try {
          const data = await readWeiboCard(card)
          const response = await chrome.runtime.sendMessage({
            command: 'save-weibo',
            data
          })
          if (!response?.ok || !response.saved)
            throw new Error(
              response?.error ||
                t(
                  '此页面未保存，请检查排除规则',
                  'Page was not saved. Check your exclusion rules.'
                )
            )
          setButtonLabel(button, t('已保存 · 再次更新', 'Saved · Update'))
          button.title = t(
            '已保存。展开正文后可再次保存更新。',
            'Saved. Save again after expanding the post.'
          )
        } catch (error) {
          setButtonLabel(button, t('重试保存', 'Retry save'))
          button.title = String(error)
        } finally {
          button.disabled = false
        }
      })
      const toolbar =
        card.querySelector(
          '[class*="toolbar_main"], [node-type="feed_list_options"], .card-act, footer'
        ) || card
      toolbar.append(button)
    }
  }
  const schedule = () => {
    if (!scheduled) scheduled = window.setTimeout(refresh, 600)
  }
  const observer = new MutationObserver((mutations) => {
    if (
      mutations.some(
        (m) =>
          !(
            m.target instanceof Element ? m.target : m.target.parentElement
          )?.closest('[data-ftb-owned]')
      )
    )
      schedule()
  })
  observer.observe(document.body, { childList: true, subtree: true })
  chrome.storage.onChanged.addListener(schedule)
  refresh()
  return () => {
    observer.disconnect()
    chrome.storage.onChanged.removeListener(schedule)
    clearTimeout(scheduled)
  }
}
