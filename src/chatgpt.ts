import { hashText } from './identity'
import { type ChatMessage } from './chatgpt-data'
import {
  installChatConversation,
  visible,
  type MessageNode,
  type ChatSiteAdapter
} from './chat-save'

// Current ChatGPT and the previous conversation-turn layout both remain in use.
export function chatGPTMessages(): MessageNode[] {
  const roots = [
    ...document.querySelectorAll<HTMLElement>(
      '[data-user-message-bubble], [data-markdown-text-style="assistant-message"], [data-message-author-role="user"], [data-message-author-role="assistant"]'
    )
  ]
  return roots
    .filter(
      (root) =>
        visible(root) &&
        !root.closest('[contenteditable="true"]') &&
        !roots.some((other) => other !== root && other.contains(root))
    )
    .map((root, index) => {
      const unit = root.closest('[data-chatgpt-search-message-ids]')
      const role: ChatMessage['role'] = root.matches(
        '[data-user-message-bubble], [data-message-author-role="user"]'
      )
        ? 'user'
        : 'assistant'
      const turnId = root
        .closest('[data-testid^="conversation-turn-"]')
        ?.getAttribute('data-testid')
      const id =
        root.getAttribute('data-message-id') ||
        root
          .closest('[data-chatgpt-selection-message-id]')
          ?.getAttribute('data-chatgpt-selection-message-id') ||
        unit
          ?.getAttribute('data-chatgpt-search-message-ids')
          ?.split(/\s+/)[0] ||
        (turnId
          ? `${turnId}-${role}`
          : `${role}-${hashText(root.innerText).replace(':', '-')}`)
      const key = unit
        ?.getAttribute('data-chatgpt-search-unit-key')
        ?.match(/(?:^|-)turn-(\d+):(\d+):/)
      const turn = turnId?.match(/conversation-turn-(\d+)/)
      return {
        root,
        role,
        id,
        order: key
          ? Number(key[1]) * 10000 + Number(key[2])
          : turn
            ? Number(turn[1]) * 10000 + (role === 'assistant' ? 1 : 0)
            : index * 10000
      }
    })
}

export function chatGPTStreaming(message: MessageNode) {
  if (message.role === 'user') return false
  const state = message.root
    .closest('[data-talvt-turn-state]')
    ?.getAttribute('data-talvt-turn-state')
  if (state && state !== 'complete') return true
  if (
    message.root.closest('[data-is-streaming="true"], .result-streaming') ||
    message.root.querySelector('[data-is-streaming="true"], .result-streaming')
  )
    return true
  // A pause in token delivery is not completion. Stop controls gate the entire
  // assistant batch, including older layouts without per-turn state markers.
  return [
    ...document.querySelectorAll<HTMLElement>(
      '[data-testid="stop-button"], [data-testid="stop-generating-button"], button[aria-label="Stop generating"], button[aria-label="停止生成"], button[aria-label="停止流式传输"]'
    )
  ].some(visible)
}

function messageToolbar(root: HTMLElement): HTMLElement | undefined {
  const boundary = root.closest(
    '[data-chatgpt-search-message-ids], [data-testid^="conversation-turn-"], article'
  )
  const toolbar = [
    ...(boundary?.querySelectorAll<HTMLElement>('.turn-action-controls') || [])
  ].find((element) => !root.contains(element))
  if (toolbar) return toolbar
  // Older layouts identify the message-copy action rather than its row.
  const copy = boundary?.querySelector<HTMLElement>(
    '[data-testid="copy-turn-action-button"], button[aria-label="Copy response"], button[aria-label="Copy message"], button[aria-label="复制消息"], button[aria-label="复制"]'
  )
  if (copy && !root.contains(copy)) return copy.parentElement || undefined

  // The current layout puts the final reply's action row beside the entire
  // turn body, outside its search-message unit. A turn may contain several
  // user/intermediate messages; only its final assistant owns that footer.
  if (
    !root.matches(
      '[data-markdown-text-style="assistant-message"], [data-message-author-role="assistant"]'
    )
  )
    return
  const turn = root.closest('[data-talvt-turn-state]')
  if (!turn) return
  const lastReply = [
    ...turn.querySelectorAll<HTMLElement>(
      '[data-markdown-text-style="assistant-message"], [data-message-author-role="assistant"]'
    )
  ]
    .filter(visible)
    .at(-1)
  if (!lastReply || !root.contains(lastReply)) return
  return [...turn.querySelectorAll<HTMLElement>('.turn-action-controls')].find(
    (row) =>
      !root.contains(row) &&
      !row.closest('[data-chatgpt-search-message-ids]') &&
      row.closest('[data-talvt-turn-state]') === turn
  )
}

export const chatGPTAdapter: ChatSiteAdapter = {
  site: 'chatgpt',
  messages: chatGPTMessages,
  streaming: chatGPTStreaming,
  toolbar: messageToolbar,
  composer() {
    const editor = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-composer-markdown], #prompt-textarea, textarea[data-id="root"]'
      )
    ].find(visible)
    return editor?.closest('form') || undefined
  }
}
export function installChatGPT(
  enabled: () => boolean,
  automatic: () => boolean
) {
  installChatConversation(chatGPTAdapter, enabled, automatic)
}
