export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  order: number
}

export type ChatSite = 'chatgpt' | 'gemini' | 'deepseek'
export const chatSiteNames = {
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  deepseek: 'DeepSeek'
}

export interface ChatConversation {
  site: ChatSite
  messages: ChatMessage[]
}

export function chatSiteForHost(host: string): ChatSite | undefined {
  if (isChatGPTHost(host)) return 'chatgpt'
  if (host === 'gemini.google.com') return 'gemini'
  if (host === 'chat.deepseek.com') return 'deepseek'
}

export function chatConversationUrl(
  raw: string,
  site?: ChatSite
): string | undefined {
  try {
    const url = new URL(raw)
    const actualSite = chatSiteForHost(url.hostname)
    if (
      !actualSite ||
      (site && actualSite !== site) ||
      url.protocol !== 'https:' ||
      url.port ||
      url.username ||
      url.password
    )
      return
    if (actualSite === 'chatgpt') return chatGPTConversationUrl(raw)
    const pattern =
      actualSite === 'gemini'
        ? /^\/(?:u\/\d+\/)?app\/[\w-]+\/?$/
        : /^\/a\/chat\/s\/[\w-]+\/?$/
    if (!pattern.test(url.pathname)) return
    return url.origin + url.pathname.replace(/\/$/, '')
  } catch {
    return
  }
}

export function isChatGPTHost(host: string) {
  return ['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'].includes(host)
}

export function chatGPTConversationUrl(raw: string): string | undefined {
  try {
    const url = new URL(raw)
    if (
      !isChatGPTHost(url.hostname) ||
      url.protocol !== 'https:' ||
      url.port ||
      url.username ||
      url.password ||
      !/^\/(?:g\/[\w-]+\/)?c\/[\w-]+\/?$/.test(url.pathname)
    )
      return
    return `https://chatgpt.com/c/${url.pathname.split('/').filter(Boolean).at(-1)}`
  } catch {
    return
  }
}

// Validate imported backups and content-script messages before storing metadata.
export function readConversation(value: unknown): ChatConversation | undefined {
  const chat = value as ChatConversation | undefined
  if (
    !chat ||
    !['chatgpt', 'gemini', 'deepseek'].includes(chat.site) ||
    !Array.isArray(chat.messages)
  )
    return
  if (!chat.messages.length || chat.messages.length > 10000) return
  const seen = new Set<string>()
  const messages: ChatMessage[] = []
  for (const m of chat.messages) {
    if (
      !m ||
      typeof m.id !== 'string' ||
      !/^[\w:.-]{1,200}$/.test(m.id) ||
      seen.has(m.id) ||
      !['user', 'assistant'].includes(m.role) ||
      typeof m.text !== 'string' ||
      !m.text.trim() ||
      !Number.isFinite(m.order) ||
      m.order < 0
    )
      return
    seen.add(m.id)
    messages.push({ id: m.id, role: m.role, text: m.text, order: m.order })
  }
  return { site: chat.site, messages }
}

export function mergeConversation(
  previous: ChatConversation | undefined,
  incoming: ChatConversation
): { conversation: ChatConversation; content: string; truncated: boolean } {
  const messages = new Map(
    (previous?.site === incoming.site ? previous.messages : []).map((m) => [
      m.id,
      m
    ])
  )
  for (const message of incoming.messages) messages.set(message.id, message)
  let remaining = 1_000_000,
    truncated = false
  const saved: ChatMessage[] = [],
    blocks: string[] = []
  for (const message of [...messages.values()].sort(
    (a, b) => a.order - b.order
  )) {
    const label =
      message.role === 'user' ? 'User / 用户' : chatSiteNames[incoming.site]
    const available = remaining - label.length - 3
    if (available <= 0) {
      truncated = true
      break
    }
    const text = message.text.slice(0, available)
    if (text.length < message.text.length) truncated = true
    saved.push({ ...message, text })
    const block = `${label}\n${text}`
    blocks.push(block)
    remaining -= block.length + 2
  }
  return {
    conversation: { site: incoming.site, messages: saved },
    content: blocks.join('\n\n'),
    truncated
  }
}
