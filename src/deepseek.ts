import {
  installChatConversation,
  visible,
  type ChatSiteAdapter,
  type MessageNode
} from './chat-save'

function toolbar(root: HTMLElement) {
  const item = root.closest('[data-virtual-list-item-key]')
  const message = root.closest('.ds-message')
  if (!item || !message) return
  // Actions are siblings of the message, not code-block copy controls.
  const action = [
    ...item.querySelectorAll<HTMLElement>(
      '.ds-flex > [role="button"], .ds-flex > button'
    )
  ].find(
    (button) =>
      !message.contains(button) && !button.hasAttribute('data-ftb-owned')
  )
  return action?.parentElement || undefined
}

export const deepseekAdapter: ChatSiteAdapter = {
  site: 'deepseek',
  messages() {
    return [
      ...document.querySelectorAll<HTMLElement>(
        '[data-virtual-list-item-key] .ds-message'
      )
    ]
      .filter(visible)
      .flatMap((message): MessageNode[] => {
        const answer = message.querySelector<HTMLElement>(
          '.ds-assistant-message-main-content'
        )
        const root =
          answer || message.querySelector<HTMLElement>('.ds-collapsible-text')
        const key = message
          .closest('[data-virtual-list-item-key]')
          ?.getAttribute('data-virtual-list-item-key')
        // Virtual-list keys survive removing and remounting off-screen messages.
        if (!root || !key || !/^\d+$/.test(key) || !visible(root)) return []
        const role = answer ? 'assistant' : 'user'
        return [
          { root, role, id: `deepseek-${key}-${role}`, order: Number(key) }
        ]
      })
  },
  streaming(message) {
    if (message.role === 'user') return false
    const item = message.root.closest('[data-virtual-list-item-key]')
    if (
      item?.matches('[aria-busy="true"], [data-is-streaming="true"]') ||
      item?.querySelector('[aria-busy="true"], [data-is-streaming="true"]')
    )
      return true
    // DeepSeek renders the response action row on completion. Do not interpret
    // a quiet interval during thinking/token delivery as a completed response.
    if (!toolbar(message.root)) return true
    return [
      ...document.querySelectorAll<HTMLElement>(
        '[aria-label="停止生成"], [aria-label="停止回答"], [aria-label="Stop generating"], [aria-label="Stop response"]'
      )
    ].some(visible)
  },
  toolbar,
  composer() {
    const editor = [
      ...document.querySelectorAll<HTMLTextAreaElement>('textarea')
    ].find(
      (element) => /DeepSeek/i.test(element.placeholder) && visible(element)
    )
    const surface = editor?.parentElement?.parentElement?.parentElement
    // The observed input surface wraps the textarea region and send controls.
    if (!surface?.querySelector('[role="button"], button')) return
    return surface.parentElement || undefined
  }
}

export function installDeepSeek(
  enabled: () => boolean,
  automatic: () => boolean
) {
  installChatConversation(deepseekAdapter, enabled, automatic)
}
