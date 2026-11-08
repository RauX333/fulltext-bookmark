import { extractVisibleText } from './capture'
import { t } from './i18n'
import { installPostButtons } from './post-buttons'
import { isTwitterHost, twitterStatusUrl } from './twitter-url'

const cardSelector = 'article[data-testid="tweet"], article[role="article"]'
const bodySelector =
  '[data-testid="tweetText"], [data-testid="tweetArticleRichTextView"], [data-testid="card.wrapper"]'
const quoteSelector = '[data-testid="quoteTweet"], [role="link"]:not(a)'

function belongsToPost(node: Element, card: Element) {
  // Quoted posts can have their own timestamp, author and status link. Those
  // links must never become the identity of the outer post (including reposts).
  return (
    node.closest(cardSelector) === card &&
    !node.closest(quoteSelector) &&
    !node.closest(bodySelector)
  )
}

export function twitterPermalink(card: Element): string | undefined {
  const links = [...card.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(
    (link) => belongsToPost(link, card)
  )
  for (const link of [
    ...links.filter((link) => link.querySelector('time')),
    ...links
  ]) {
    const url = twitterStatusUrl(link.href)
    if (url) return url
  }
}

export function findTwitterCards(root: ParentNode = document): Element[] {
  return [...root.querySelectorAll(cardSelector)].filter(
    (card) =>
      !card.parentElement?.closest(cardSelector) &&
      !card.closest(quoteSelector) &&
      !!twitterPermalink(card)
  )
}

export async function readTwitterCard(card: Element) {
  const url = twitterPermalink(card)
  if (!url)
    throw new Error(t('未找到 X 帖子链接', 'Cannot find an X post permalink'))
  const candidates = [...card.querySelectorAll(bodySelector)]
  const bodies = candidates.filter(
    (node) =>
      !candidates.some((parent) => parent !== node && parent.contains(node))
  )
  const captures = await Promise.all(
    (bodies.length ? bodies : [card]).map((body) => extractVisibleText(body))
  )
  const text = captures
    .map((capture) => capture.text)
    .filter(Boolean)
    .join('\n')
  const author = [...card.querySelectorAll('[data-testid="User-Name"]')].find(
    (node) => belongsToPost(node, card)
  )
  const handle = new URL(url).pathname.split('/')[1]
  const name = author?.querySelector('a[href]')?.textContent?.trim()
  return {
    url,
    title: `${name ? name + ' ' : ''}${handle !== 'i' ? '@' + handle + ': ' : ''}${text.slice(0, 120)}`,
    content: text,
    date: Date.now(),
    truncated: captures.some((capture) => capture.truncated)
  }
}

export function installTwitterButtons(enabled: () => boolean) {
  if (!isTwitterHost(location.hostname)) return () => {}
  return installPostButtons(
    {
      id: 'twitter',
      findCards: findTwitterCards,
      permalink: twitterPermalink,
      read: readTwitterCard,
      toolbar: (card) =>
        [...card.querySelectorAll('[role="group"]')].find((node) =>
          belongsToPost(node, card)
        ),
      description: () =>
        t(
          'Fulltext Bookmark：保存已加载的 X 帖子及引用文字；长帖请先展开',
          'Fulltext Bookmark: save the loaded X post and quoted text. Expand long posts before saving.'
        )
    },
    enabled
  )
}
