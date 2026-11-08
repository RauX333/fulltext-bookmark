import icon from 'data-base64:../assets/icon512.png'
import { extractVisibleText } from './capture'
import { hashText } from './identity'
import { t } from './i18n'
import { contentContextActive, onContentInvalidated } from './content-context'
import {
  chatConversationUrl,
  chatSiteForHost,
  chatSiteNames,
  type ChatMessage,
  type ChatSite
} from './chatgpt-data'

export interface MessageNode {
  root: HTMLElement
  id: string
  role: ChatMessage['role']
  order: number
}
export interface ChatSiteAdapter {
  site: ChatSite
  messages(): MessageNode[]
  streaming(message: MessageNode): boolean
  toolbar(root: HTMLElement): HTMLElement | undefined
  // An outer surface whose right edge can reserve space without moving native controls.
  composer(): HTMLElement | undefined
  ignoreSelector?: string
}
export function visible(element: HTMLElement) {
  return (
    element.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }) &&
    !element.closest('[hidden], [aria-hidden="true"]')
  )
}

export function installChatConversation(
  adapter: ChatSiteAdapter,
  enabled: () => boolean,
  automatic: () => boolean
) {
  const { site } = adapter
  const name = chatSiteNames[site]
  if (chatSiteForHost(location.hostname) !== site) return
  const conversationUrl = (url: string) => chatConversationUrl(url, site)
  let route = '',
    timer = 0,
    autoTimer = 0,
    running = false
  const saved = new Map<string, string>()
  const stable = new Map<string, { hash: string; since: number }>()
  const storedHashes = new Map<string, string>()
  const textCache = new WeakMap<
    HTMLElement,
    { domHash: string; contentHash: string }
  >()
  let stateLoaded = false,
    statePending = false,
    statusRunning = false,
    statusAgain = false,
    revision = 0
  const controls = new Map<
    HTMLElement,
    { button: HTMLButtonElement; toolbar: HTMLElement; id: string }
  >()
  let composerButton: HTMLButtonElement | undefined
  let composerForm: HTMLElement | undefined
  const style = document.createElement('style')
  style.dataset.ftbOwned = 'true'
  style.textContent = `
    [data-ftb-chat-composer] { position:relative!important; max-width:calc(100% - 44px)!important; margin-inline-end:44px!important; }
    [data-ftb-chat-save="conversation"] { position:absolute!important; inset-inline-end:-44px; bottom:8px; }
    [data-ftb-chat-save] { position:relative; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; width:32px; height:32px; padding:5px; margin:0; border:1px solid transparent; border-radius:8px; background:transparent; cursor:pointer; vertical-align:middle; line-height:1; }
    [data-ftb-chat-save]:hover { background:#8882; }
    [data-ftb-chat-save]:focus-visible { outline:2px solid #287e62; outline-offset:2px; }
    [data-ftb-chat-save][data-save-state="saved"] { background:#d8f3e5; border-color:#287e6266; }
    [data-ftb-chat-save][data-save-state="error"] { border-color:#be4545; }
    [data-ftb-chat-save] .ftb-saved-check { position:absolute; right:-1px; bottom:-1px; width:13px; height:13px; border-radius:50%; background:#287e62; color:white; font:bold 10px/13px sans-serif; text-align:center; pointer-events:none; }
    [data-ftb-chat-save] .ftb-saved-check[hidden] { display:none!important; }
  `
  document.head.append(style)
  const cleanupButtons = () => {
    for (const pair of controls.values()) {
      pair.button.remove()
    }
    controls.clear()
    composerButton?.remove()
    composerButton = undefined
    composerForm?.removeAttribute('data-ftb-chat-composer')
    composerForm = undefined
  }
  const resetRoute = () => {
    const next = conversationUrl(location.href) || ''
    if (next !== route) {
      route = next
      saved.clear()
      stable.clear()
      storedHashes.clear()
      stateLoaded = false
      revision++
      cleanupButtons()
    }
  }
  const readMessages = async (nodes: MessageNode[], url: string) => {
    const messages: ChatMessage[] = []
    let truncated = false
    for (const node of nodes) {
      if (adapter.streaming(node)) continue
      const content = await extractVisibleText(
        node.root,
        () =>
          !contentContextActive() ||
          conversationUrl(location.href) !== url ||
          !enabled(),
        adapter.ignoreSelector
      )
      if (!node.root.isConnected || adapter.streaming(node)) continue
      if (content.text)
        messages.push({
          id: node.id,
          role: node.role,
          order: node.order,
          text: content.text
        })
      truncated ||= content.truncated
    }
    return { messages, truncated }
  }
  const persist = async (
    messages: ChatMessage[],
    url: string,
    auto: boolean,
    truncated: boolean
  ) => {
    if (
      !contentContextActive() ||
      !messages.length ||
      !enabled() ||
      (auto && !automatic()) ||
      conversationUrl(location.href) !== url
    )
      return false
    const title = document.title.trim() || name
    const response = await chrome.runtime.sendMessage({
      command: `save-${site}`,
      automatic: auto,
      data: {
        url,
        title: `${name} · ${title}`,
        content: '',
        truncated,
        conversation: { site, messages }
      }
    })
    if (!contentContextActive()) return false
    if (!response?.ok || !response.saved)
      throw new Error(
        response?.error ||
          t(
            '未保存，请检查保存设置和排除规则',
            'Not saved. Check capture settings and excluded URLs.'
          )
      )
    if (conversationUrl(location.href) === url) {
      revision++
      for (const message of messages)
        storedHashes.set(message.id, hashText(message.text))
      void refreshStatus()
    }
    return true
  }
  const label = (
    button: HTMLButtonElement,
    state: 'saved' | 'unsaved' | 'saving' | 'error',
    notice = ''
  ) => {
    const description =
      button.dataset.ftbChatSave === 'conversation'
        ? t(
            '保存整个对话到 Fulltext Bookmark（已加载的消息）',
            'Save conversation to Fulltext Bookmark (loaded messages)'
          )
        : t(
            '保存这条消息到 Fulltext Bookmark',
            'Save message to Fulltext Bookmark'
          )
    const status =
      notice ||
      (state === 'saved'
        ? t('已保存 · 点击更新', 'Saved · Click to update')
        : state === 'saving'
          ? t('保存中…', 'Saving…')
          : t('未保存 · 点击保存', 'Not saved · Click to save'))
    button.dataset.saveState = state
    const check = button.querySelector<HTMLElement>('.ftb-saved-check')
    if (check) check.hidden = state !== 'saved'
    button.title = `${description} · ${status}`
    button.setAttribute('aria-label', button.title)
  }
  const makeButton = (root?: HTMLElement) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.ftbOwned = 'true'
    button.dataset.ftbChatSave = root ? 'message' : 'conversation'
    button.setAttribute(`data-ftb-${site}`, button.dataset.ftbChatSave)
    const image = document.createElement('img')
    image.src = icon
    image.alt = ''
    image.width = 20
    image.height = 20
    image.style.cssText =
      'width:20px;height:20px;object-fit:contain;pointer-events:none'
    button.append(image)
    const check = document.createElement('span')
    check.className = 'ftb-saved-check'
    check.setAttribute('aria-hidden', 'true')
    check.textContent = '✓'
    button.append(check)
    label(button, 'unsaved')
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (!contentContextActive()) return
      resetRoute()
      if (!enabled() || !route) return
      const url = route
      const nodes = adapter
        .messages()
        .filter((node) => !root || node.root === root)
      button.disabled = true
      label(button, 'saving')
      try {
        if (nodes.some(adapter.streaming))
          throw new Error(
            t(
              '回复正在生成，请在结束后保存',
              'Response is generating. Save after it finishes.'
            )
          )
        const result = await readMessages(nodes, url)
        if (!result.messages.length)
          throw new Error(t('暂无可保存的消息', 'No messages to save yet'))
        if (await persist(result.messages, url, false, result.truncated)) {
          label(button, 'saved')
        }
      } catch (error) {
        if (!contentContextActive()) return
        label(button, 'error', String(error))
      } finally {
        button.disabled = false
      }
    })
    return button
  }
  const refreshStatus = async () => {
    if (!contentContextActive() || !enabled() || !route) return
    if (statusRunning) {
      statusAgain = true
      return
    }
    statusRunning = true
    const url = route
    try {
      const nodes = adapter.messages()
      let allSaved = nodes.length > 0
      for (const node of nodes) {
        const domHash = hashText(node.root.innerText)
        let cached = textCache.get(node.root)
        if (!cached || cached.domHash !== domHash) {
          const result = await extractVisibleText(
            node.root,
            () => !contentContextActive() || route !== url || !enabled(),
            adapter.ignoreSelector
          )
          if (!contentContextActive() || route !== url || !enabled()) return
          cached = { domHash, contentHash: hashText(result.text) }
          textCache.set(node.root, cached)
        }
        const isSaved =
          !adapter.streaming(node) &&
          storedHashes.get(node.id) === cached.contentHash
        allSaved &&= isSaved
        const button = controls.get(node.root)?.button
        if (button && !button.disabled)
          label(button, isSaved ? 'saved' : 'unsaved')
      }
      if (composerButton && !composerButton.disabled)
        label(composerButton, allSaved ? 'saved' : 'unsaved')
    } finally {
      statusRunning = false
      if (statusAgain) {
        statusAgain = false
        void refreshStatus()
      }
    }
  }
  const loadSavedState = async () => {
    if (
      !contentContextActive() ||
      stateLoaded ||
      statePending ||
      !enabled() ||
      !route
    )
      return
    statePending = true
    const url = route,
      version = revision
    try {
      const response = await chrome.runtime.sendMessage({
        command: `${site}-saved-state`
      })
      if (
        contentContextActive() &&
        response?.ok &&
        route === url &&
        version === revision
      ) {
        storedHashes.clear()
        for (const [id, hash] of Object.entries(response.hashes || {}))
          if (typeof hash === 'string') storedHashes.set(id, hash)
        stateLoaded = true
        await refreshStatus()
      }
    } catch {
      /* A later DOM change can retry a transient worker failure. */
    } finally {
      statePending = false
      if (contentContextActive() && (route !== url || version !== revision))
        schedule()
    }
  }
  const refresh = () => {
    timer = 0
    if (!contentContextActive()) return
    resetRoute()
    if (!enabled() || !route) {
      cleanupButtons()
      return
    }
    const nodes = adapter.messages()
    for (const [root, pair] of controls) {
      if (
        !nodes.some((node) => node.root === root && node.id === pair.id) ||
        !pair.button.isConnected ||
        adapter.toolbar(root) !== pair.toolbar
      ) {
        pair.button.remove()
        controls.delete(root)
      }
    }
    // A site may clone/remount virtual-list DOM including our button markup,
    // but cloned nodes have no click handlers. Replace those orphan controls.
    const activeButtons = new Set(
      [...controls.values()].map((pair) => pair.button)
    )
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      '[data-ftb-chat-save="message"]'
    ))
      if (!activeButtons.has(button)) button.remove()
    for (const node of nodes) {
      if (controls.has(node.root)) continue
      const toolbar = adapter.toolbar(node.root)
      if (!toolbar) continue
      // Inherit the native row's hover/focus/touch visibility. Never insert
      // controls above the message or into code/table action toolbars.
      const button = makeButton(node.root)
      toolbar.append(button)
      controls.set(node.root, { button, toolbar, id: node.id })
    }
    const form = adapter.composer()
    if (
      composerButton &&
      (!composerButton.isConnected || form !== composerForm)
    ) {
      composerButton.remove()
      composerButton = undefined
      composerForm?.removeAttribute('data-ftb-chat-composer')
      composerForm = undefined
    }
    if (form && !composerButton && nodes.length) {
      composerButton = makeButton()
      composerForm = form
      form.setAttribute('data-ftb-chat-composer', 'true')
      form.append(composerButton)
    }
    void loadSavedState()
    void refreshStatus()
  }
  const autoSave = async () => {
    autoTimer = 0
    if (!contentContextActive()) return
    resetRoute()
    if (!enabled() || !automatic() || !route || running) return
    running = true
    const url = route
    try {
      const nodes = adapter.messages()
      const batch: MessageNode[] = []
      for (const node of nodes) {
        if (adapter.streaming(node)) {
          stable.delete(node.id)
          continue
        }
        const hash = hashText(node.root.innerText)
        const observation = stable.get(node.id)
        if (!observation || observation.hash !== hash) {
          stable.set(node.id, { hash, since: Date.now() })
          continue
        }
        if (
          Date.now() - observation.since >= 1600 &&
          saved.get(node.id) !== hash
        )
          batch.push(node)
      }
      if (batch.length) {
        const hashes = new Map(
          batch.map((node) => [node.id, hashText(node.root.innerText)])
        )
        const result = await readMessages(batch, url)
        result.messages = result.messages.filter((m) => {
          const node = batch.find((n) => n.id === m.id)!
          return (
            !adapter.streaming(node) &&
            hashes.get(m.id) === hashText(node.root.innerText)
          )
        })
        if (await persist(result.messages, url, true, result.truncated)) {
          if (route === url)
            for (const m of result.messages) saved.set(m.id, hashes.get(m.id)!)
        }
      }
    } catch {
      /* Failed writes remain eligible for the next stable pass. */
    } finally {
      running = false
      if (contentContextActive() && enabled() && automatic())
        autoTimer = window.setTimeout(() => void autoSave(), 1800)
    }
  }
  const schedule = () => {
    if (!contentContextActive()) return
    if (!timer) timer = window.setTimeout(refresh, 250)
    if (!autoTimer && !running)
      autoTimer = window.setTimeout(() => void autoSave(), 1800)
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
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [
      'aria-busy',
      'data-virtual-list-item-key',
      'data-turn-id',
      'data-testid',
      'aria-label',
      'data-talvt-turn-state',
      'data-is-streaming',
      'data-message-id',
      'data-chatgpt-search-message-ids',
      'hidden',
      'aria-hidden',
      'class'
    ]
  })
  chrome.storage.onChanged.addListener(schedule)
  const routeChanged = (message: { command?: string }) => {
    if (message.command === 'route-changed') schedule()
  }
  chrome.runtime.onMessage.addListener(routeChanged)
  window.addEventListener('popstate', schedule)
  onContentInvalidated(() => {
    observer.disconnect()
    clearTimeout(timer)
    clearTimeout(autoTimer)
    window.removeEventListener('popstate', schedule)
    cleanupButtons()
    saved.clear()
    stable.clear()
    storedHashes.clear()
    style.remove()
    chrome.storage.onChanged.removeListener(schedule)
    chrome.runtime.onMessage.removeListener(routeChanged)
  })
  refresh()
  schedule()
}
