import { extractVisibleText } from './capture'
import { t } from './i18n'
import { installPostButtons } from './post-buttons'

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
        'a[class*="head_name"], a[class*="head-info_name"], a[class*="_name_"], [node-type="feed_list_originNick"], .m-text-cut, a.name'
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
  return installPostButtons(
    {
      id: 'weibo',
      findCards: findWeiboCards,
      permalink: weiboPermalink,
      read: readWeiboCard,
      toolbar: (card) =>
        [
          ...card.querySelectorAll(
            '[class*="toolbar_main"], [node-type="feed_list_options"], .card-act, footer'
          )
        ].at(-1),
      description: () =>
        t(
          'Fulltext Bookmark：保存已加载的微博文字；长微博请先展开',
          'Fulltext Bookmark: save the loaded post. Expand long posts before saving.'
        )
    },
    enabled
  )
}
