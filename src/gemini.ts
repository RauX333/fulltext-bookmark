import {
  installChatConversation,
  visible,
  type ChatSiteAdapter,
  type MessageNode
} from './chat-save'

function toolbar(root: HTMLElement) {
  const message = root.closest('user-query, model-response')
  return (
    message?.querySelector<HTMLElement>(
      '.luminous-actions-container, message-actions .buttons-container-v2, message-actions .buttons-container'
    ) || undefined
  )
}

export const geminiAdapter: ChatSiteAdapter = {
  site: 'gemini',
  ignoreSelector: '.cdk-visually-hidden, .screen-reader-user-query-label',
  messages() {
    return [
      ...document.querySelectorAll<HTMLElement>(
        'user-query .query-text, model-response message-content .markdown'
      )
    ]
      .filter(visible)
      .flatMap((root, index): MessageNode[] => {
        const role = root.closest('user-query') ? 'user' : 'assistant'
        const turn = root.closest('.conversation-container')
        const key =
          root.closest('[data-turn-id]')?.getAttribute('data-turn-id') ||
          turn?.id
        const id = key || root.closest('message-content')?.id
        if (!id) return []
        const sequence = turn
          ?.querySelector('[id^="user-query-content-"]')
          ?.id.match(/-(\d+)$/)
        return [
          {
            root,
            role,
            id: `${id}-${role}`,
            order: sequence
              ? Number(sequence[1]) * 2 + (role === 'assistant' ? 1 : 0)
              : index
          }
        ]
      })
  },
  streaming(message) {
    if (message.role === 'user') return false
    if (
      message.root.matches('[aria-busy="true"]') ||
      message.root.closest('[aria-busy="true"]')
    )
      return true
    if (!toolbar(message.root)) return true
    return [
      ...document.querySelectorAll<HTMLElement>(
        '[data-test-id="stop-response-button"], [aria-label="Stop response"], [aria-label="停止回答"], [aria-label="停止生成"]'
      )
    ].some(visible)
  },
  toolbar,
  composer() {
    return [
      ...document.querySelectorAll<HTMLElement>(
        'input-container .input-area-container'
      )
    ].find(visible)
  }
}

export function installGemini(
  enabled: () => boolean,
  automatic: () => boolean
) {
  installChatConversation(geminiAdapter, enabled, automatic)
}
