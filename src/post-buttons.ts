import { t } from './i18n'
import type { PageInput } from './types'
import icon from 'data-base64:../assets/icon512.png'
import { contentContextActive, onContentInvalidated } from './content-context'

interface PostButtons {
  id: 'weibo' | 'twitter'
  findCards: () => Element[]
  permalink: (card: Element) => string | undefined
  read: (card: Element) => Promise<PageInput>
  toolbar: string | ((card: Element) => Element | undefined)
  description: () => string
}

function setButtonLabel(button: HTMLButtonElement, text: string) {
  if (!button.querySelector('img')) {
    const image = document.createElement('img')
    image.src = icon
    image.alt = 'Fulltext Bookmark'
    image.width = 20
    image.height = 20
    image.style.cssText =
      'width:20px;height:20px;object-fit:contain;vertical-align:middle'
    button.replaceChildren(image, document.createElement('span'))
  }
  button.querySelector('span')!.textContent = text
}

// Both sites recycle feed nodes. Resolve the URL and text again on every click.
export function installPostButtons(
  adapter: PostButtons,
  enabled: () => boolean
) {
  const selector = `[data-ftb-${adapter.id}]`
  let scheduled = 0
  const reset = (button: HTMLButtonElement, url: string) => {
    button.dataset.url = url
    setButtonLabel(button, t('保存帖子', 'Save post'))
    button.title = adapter.description()
    button.disabled = false
  }
  const refresh = () => {
    scheduled = 0
    if (!contentContextActive()) return
    const cards = enabled() ? adapter.findCards() : []
    document.querySelectorAll(selector).forEach((button) => {
      if (!cards.some((card) => card.contains(button))) button.remove()
    })
    for (const card of cards) {
      const url = adapter.permalink(card)!
      const existing = card.querySelector<HTMLButtonElement>(selector)
      if (existing) {
        if (existing.dataset.url !== url) reset(existing, url)
        continue
      }
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.ftbOwned = 'true'
      button.setAttribute(`data-ftb-${adapter.id}`, 'true')
      reset(button, url)
      button.style.cssText =
        'display:inline-flex;align-items:center;gap:5px;margin:6px;padding:3px 7px;border:1px solid #e5e7eb;border-radius:5px;background:#fff;color:#6b7280;font:12px sans-serif;cursor:pointer;position:relative;z-index:1'
      button.addEventListener('click', async (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!contentContextActive() || !enabled()) return
        const clickedUrl = adapter.permalink(card)
        button.disabled = true
        setButtonLabel(button, t('保存中…', 'Saving…'))
        try {
          const data = await adapter.read(card)
          if (!contentContextActive() || adapter.permalink(card) !== clickedUrl)
            return
          const response = await chrome.runtime.sendMessage({
            command: `save-${adapter.id}`,
            data
          })
          if (!contentContextActive()) return
          if (!response?.ok || !response.saved)
            throw new Error(
              response?.error ||
                t(
                  '此页面未保存，请检查排除规则',
                  'Page was not saved. Check your exclusion rules.'
                )
            )
          if (adapter.permalink(card) !== clickedUrl) return
          setButtonLabel(button, t('已保存 · 再次更新', 'Saved · Update'))
          button.title = t(
            '已保存。展开正文后可再次保存更新。',
            'Saved. Save again after expanding the post.'
          )
        } catch (error) {
          if (!contentContextActive()) return
          if (adapter.permalink(card) === clickedUrl) {
            setButtonLabel(button, t('重试保存', 'Retry save'))
            button.title = String(error)
          }
        } finally {
          button.disabled = false
        }
      })
      const toolbar =
        (typeof adapter.toolbar === 'string'
          ? card.querySelector(adapter.toolbar)
          : adapter.toolbar(card)) || card
      toolbar.append(button)
    }
  }
  const schedule = () => {
    if (!contentContextActive()) return
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
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['href']
  })
  chrome.storage.onChanged.addListener(schedule)
  const cleanup = () => {
    observer.disconnect()
    clearTimeout(scheduled)
    document.querySelectorAll(selector).forEach((button) => button.remove())
    chrome.storage.onChanged.removeListener(schedule)
  }
  onContentInvalidated(cleanup)
  refresh()
  return cleanup
}
