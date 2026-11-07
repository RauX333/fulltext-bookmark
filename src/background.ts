import {
  db,
  savePage,
  reindexBatch,
  expirePages,
  deletePages,
  INDEX_VERSION
} from './database'
import { getSettings, saveSettings, isExcluded } from './settings'
import { searchPages, searchTabs } from './search'
import { normalizeUrl } from './text'
import type { PageInput, SearchRequest } from './types'
import { setLanguage, t } from './i18n'
import { sendRemote, testRemote } from './remote'
import { migrateSettings } from './settings'
import { configureAction, openSearchPopup } from './presentation'

const activeSearches = new Map<string, symbol>()
const internal = (sender: chrome.runtime.MessageSender) =>
  sender.id === chrome.runtime.id &&
  sender.url?.startsWith(chrome.runtime.getURL(''))
let maintenance: Promise<void> | undefined
async function runMaintenance() {
  return (maintenance ??= (async () => {
    const settings = await getSettings()
    let remaining = await reindexBatch()
    // Short resumable batches: suspension never requires starting over.
    for (let i = 0; remaining && i < 7; i++) remaining = await reindexBatch()
    if (remaining)
      await chrome.alarms.create('reindex', { delayInMinutes: 0.5 })
    if (!remaining) {
      const resume = await db.meta.get('retentionResumeAt')
      if (Date.now() >= Number(resume?.value || 0))
        await expirePages(settings.tempPageExpireTime)
    }
  })().finally(() => {
    maintenance = undefined
  }))
}
async function isBookmark(url: string) {
  const found = await chrome.bookmarks.search({ url })
  return found.some((node) => node.url === url)
}
async function captureConfig(sender: chrome.runtime.MessageSender) {
  const settings = await getSettings()
  const url = await senderPageUrl(sender)
  return {
    ok: true,
    settings: {
      language: settings.language,
      storeEveryPage: settings.storeEveryPage && !sender.tab?.incognito,
      bookmarkAdaption: settings.bookmarkAdaption,
      forbiddenURLs: settings.forbiddenURLs,
      searchEngineAdaption: settings.searchEngineAdaption,
      weiboSupport: settings.weiboSupport
    },
    bookmarked: await isBookmark(url)
  }
}
async function senderPageUrl(sender: chrome.runtime.MessageSender) {
  if (sender.tab?.id !== undefined) {
    const frame = await chrome.webNavigation.getFrame({
      tabId: sender.tab.id,
      frameId: sender.frameId || 0
    })
    if (frame) {
      if (sender.documentId && frame.documentId !== sender.documentId)
        throw new Error(
          t(
            '页面已关闭或跳转，请重新保存',
            'The page navigated. Please capture it again.'
          )
        )
      return frame.url
    }
  }
  return sender.url || ''
}
async function handleMessage(
  message: Record<string, any>,
  sender: chrome.runtime.MessageSender
) {
  if (sender.id !== chrome.runtime.id)
    throw new Error(t('消息来源无效', 'Untrusted sender'))
  if (message.command === 'capture-config') return captureConfig(sender)
  const trusted = internal(sender)
  const settings = await getSettings()
  setLanguage(settings.language)
  if (message.command === 'capture' || message.command === 'save-weibo') {
    if (!sender.tab || sender.tab.incognito || sender.frameId !== 0)
      return { ok: true, saved: false }
    const input = message.data as PageInput
    if (
      !input ||
      typeof input.url !== 'string' ||
      typeof input.content !== 'string'
    )
      throw new Error(t('网页文字格式无效', 'Invalid capture'))
    const senderUrl = normalizeUrl(await senderPageUrl(sender))
    const url = normalizeUrl(input.url)
    const weibo = message.command === 'save-weibo'
    if (weibo) {
      if (
        !settings.weiboSupport ||
        !/(^|\.)weibo\.(com|cn)$/.test(new URL(senderUrl).hostname) ||
        !/(^|\.)weibo\.(com|cn)$/.test(new URL(url).hostname)
      )
        throw new Error(t('微博页面来源无效', 'Invalid Weibo origin'))
    } else if (url !== senderUrl)
      throw new Error(
        t('页面地址已变化，请重试保存', 'Page URL changed; retry capture')
      )
    if (isExcluded(url, settings.forbiddenURLs))
      return { ok: true, saved: false }
    const bookmarked = weibo || (await isBookmark(url))
    if (
      !weibo &&
      !settings.storeEveryPage &&
      !(settings.bookmarkAdaption && bookmarked)
    )
      return { ok: true, saved: false }
    const result = await savePage({
      url,
      title: String(input.title || ''),
      content: input.content,
      date: Date.now(),
      isBookmarked: bookmarked || undefined,
      mergeContent: true,
      truncated: !!input.truncated
    })
    await chrome.action
      .setBadgeText({ tabId: sender.tab.id!, text: '✓' })
      .catch(() => {})
    await chrome.action
      .setBadgeBackgroundColor({ tabId: sender.tab.id!, color: '#287e62' })
      .catch(() => {})
    if (
      result.changed &&
      settings.remoteStore &&
      (settings.remoteStoreEveryPage || bookmarked)
    )
      void sendRemote(settings, {
        url,
        title: input.title,
        date: Date.now(),
        isBookmarked: bookmarked
      }).catch(() => {})
    return { ok: true, saved: true, ...result }
  }
  if (message.command === 'search-companion') {
    if (
      !settings.searchEngineAdaption ||
      !/(^|\.)(google\.[a-z.]+|bing\.com|baidu\.com)$/.test(
        new URL(sender.url || 'https://invalid').hostname
      )
    )
      throw new Error(
        t('搜索引擎结果展示不可用', 'Search companion is unavailable')
      )
    const response = await searchPages({
      query: String(message.query || ''),
      limit: 1,
      source: settings.showOnlyBookmarkedResults ? 'bookmarks' : 'all',
      fuzzy: settings.fuzzySearch
    })
    return { ok: true, result: response.results[0] }
  }
  // Only extension pages can export, import, delete, change settings or call remote APIs.
  if (!trusted)
    throw new Error(
      t(
        '请从扩展页面执行此操作',
        'This command is restricted to extension pages'
      )
    )
  switch (message.command) {
    case 'settings':
      return { ok: true, settings }
    case 'save-settings': {
      const saved = await saveSettings(message.settings)
      await configureAction(saved)
      for (const tab of await chrome.tabs.query({}))
        if (tab.id)
          void chrome.tabs
            .sendMessage(tab.id, { command: 'route-changed' })
            .catch(() => {})
      return { ok: true, settings: saved }
    }
    case 'open-popup':
      await openSearchPopup(String(message.query || ''), message.windowId)
      return { ok: true }
    case 'search': {
      const request: SearchRequest = {
        ...message.request,
        limit: message.request?.limit || settings.maxResults
      }
      if (request.source === 'tabs') {
        const results = searchTabs(await chrome.tabs.query({}), request)
        return {
          ok: true,
          results,
          total: results.length,
          elapsed: 0,
          indexing: 0
        }
      }
      const client = sender.documentId || sender.url || String(sender.tab?.id)
      const token = Symbol()
      activeSearches.set(client, token)
      try {
        return {
          ok: true,
          ...(await searchPages(
            request,
            db,
            false,
            () => activeSearches.get(client) !== token
          ))
        }
      } finally {
        if (activeSearches.get(client) === token) activeSearches.delete(client)
      }
    }
    case 'stats':
      return {
        ok: true,
        pages: await db.pages.count(),
        pending: await db.pages
          .where('indexVersion')
          .below(INDEX_VERSION)
          .count()
      }
    case 'delete-page':
      await deletePages([Number(message.id)])
      return { ok: true }
    case 'clear':
      await db.transaction('rw', db.tables, () =>
        Promise.all(db.tables.map((table) => table.clear()))
      )
      return { ok: true }
    case 'switch-tab': {
      const tab = await chrome.tabs.get(Number(message.tabId))
      await chrome.tabs.update(tab.id!, { active: true })
      await chrome.windows.update(tab.windowId, { focused: true })
      return { ok: true }
    }
    case 'import-history':
      return { ok: true, count: await importHistory() }
    case 'sync-bookmarks':
      return { ok: true, count: await syncBookmarks() }
    case 'test-remote':
      return {
        ok: true,
        message: await testRemote(migrateSettings(message.settings))
      }
    default:
      throw new Error(t('不支持的操作', 'Unknown command'))
  }
}
// Register synchronously, before any storage or database awaits.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  void handleMessage(message || {}, sender).then(respond, (error) =>
    respond({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    })
  )
  return true
})
chrome.runtime.onInstalled.addListener(() => {
  void setup().catch(console.error)
})
chrome.runtime.onStartup.addListener(() => {
  void setup().catch(console.error)
})
async function setup() {
  await configureAction(await getSettings())
  await chrome.alarms.create('maintenance', { periodInMinutes: 60 })
  await syncBookmarks()
  await runMaintenance()
}
chrome.alarms.onAlarm.addListener((alarm) => {
  if (['maintenance', 'reindex'].includes(alarm.name))
    void runMaintenance().catch(console.error)
})
const notifyRoute = (details: { tabId: number; frameId: number }) => {
  if (details.frameId !== 0) return
  void chrome.tabs
    .sendMessage(details.tabId, { command: 'route-changed' })
    .catch(() => {})
}
chrome.webNavigation.onHistoryStateUpdated.addListener(notifyRoute)
chrome.webNavigation.onReferenceFragmentUpdated.addListener(notifyRoute)
chrome.tabs.onUpdated.addListener((id, change) => {
  if (change.status === 'loading')
    void chrome.action.setBadgeText({ tabId: id, text: '' }).catch(() => {})
})
async function syncBookmarks() {
  if (!(await getSettings()).bookmarkAdaption) return 0
  const nodes = await chrome.bookmarks.getTree(),
    bookmarks: chrome.bookmarks.BookmarkTreeNode[] = []
  const walk = (node: chrome.bookmarks.BookmarkTreeNode) => {
    if (node.url) bookmarks.push(node)
    node.children?.forEach(walk)
  }
  nodes.forEach(walk)
  let count = 0
  for (const node of bookmarks) {
    if (!/^https?:\/\//.test(node.url!)) continue
    await savePage({
      url: node.url!,
      title: node.title,
      date: node.dateAdded,
      isBookmarked: true,
      source: 'bookmark'
    })
    count++
  }
  return count
}
chrome.bookmarks.onCreated.addListener((_id, node) => {
  void (async () => {
    if (
      !node.url ||
      !/^https?:\/\//.test(node.url) ||
      !(await getSettings()).bookmarkAdaption
    )
      return
    await savePage({
      url: node.url,
      title: node.title,
      date: node.dateAdded,
      isBookmarked: true,
      source: 'bookmark'
    })
    for (const tab of await chrome.tabs.query({}))
      if (tab.url === node.url && tab.id)
        void chrome.tabs
          .sendMessage(tab.id, { command: 'capture-now' })
          .catch(() => {})
  })().catch(console.error)
})
chrome.bookmarks.onChanged.addListener(() => {
  void syncBookmarks().catch(console.error)
})
chrome.bookmarks.onRemoved.addListener((_id, info) => {
  const walk = async (node: chrome.bookmarks.BookmarkTreeNode) => {
    if (
      node.url &&
      /^https?:\/\//.test(node.url) &&
      !(await isBookmark(node.url))
    )
      await db.pages
        .where('url')
        .equals(normalizeUrl(node.url))
        .modify({ isBookmarked: false })
    for (const child of node.children || []) await walk(child)
  }
  void walk(info.node).catch(console.error)
})
async function importHistory() {
  if (!(await chrome.permissions.contains({ permissions: ['history'] })))
    throw new Error(
      t('需要允许读取浏览历史才能导入', 'History permission is required')
    )
  const settings = await getSettings()
  const visited = await chrome.history.search({
    text: '',
    startTime: 0,
    maxResults: 50000
  })
  let count = 0
  for (const item of visited) {
    if (
      !item.url ||
      !/^https?:\/\//.test(item.url) ||
      isExcluded(item.url, settings.forbiddenURLs)
    )
      continue
    await savePage({
      url: item.url,
      title: item.title || '',
      date: item.lastVisitTime,
      source: 'history'
    })
    count++
  }
  return count
}
let omniboxSequence = 0
const xml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;'
      })[c]!
  )
chrome.omnibox.onInputChanged.addListener((query, suggest) => {
  const sequence = ++omniboxSequence
  void getSettings()
    .then((settings) =>
      settings.omniboxEnabled
        ? searchPages({
            query,
            limit: Math.min(5, settings.maxResults),
            source: settings.showOnlyBookmarkedResults ? 'bookmarks' : 'all',
            fuzzy: settings.fuzzySearch
          })
        : { results: [], total: 0, elapsed: 0, indexing: 0 }
    )
    .then((response) => {
      if (sequence === omniboxSequence)
        suggest(
          response.results.map((p) => ({
            content: p.url,
            description: `${xml(p.title)} — <url>${xml(p.url)}</url>`
          }))
        )
    })
    .catch(() => suggest([]))
})
chrome.omnibox.onInputStarted.addListener(() => {
  void getSettings().then((settings) => {
    setLanguage(settings.language)
    chrome.omnibox.setDefaultSuggestion({
      description: settings.omniboxEnabled
        ? t('搜索全文书签：%s', 'Search Fulltext Bookmark: %s')
        : t(
            '地址栏搜索已关闭，可在设置中开启',
            'Address bar search is disabled. Enable it in Settings.'
          )
    })
  })
})
chrome.omnibox.onInputCancelled.addListener(() => {
  omniboxSequence++
})
chrome.omnibox.onInputEntered.addListener((input, disposition) => {
  let url: string
  try {
    url = normalizeUrl(input)
  } catch {
    url = chrome.runtime.getURL(
      `tabs/search.html?q=${encodeURIComponent(input)}`
    )
  }
  if (disposition === 'currentTab') void chrome.tabs.update({ url })
  else
    void chrome.tabs.create({ url, active: disposition !== 'newBackgroundTab' })
})
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-search')
    void chrome.tabs.create({ url: chrome.runtime.getURL('tabs/search.html') })
})
chrome.action.onClicked.addListener(() => {
  void getSettings()
    .then((settings) => {
      if (settings.searchDisplay === 'tab')
        return chrome.tabs.create({
          url: chrome.runtime.getURL('tabs/search.html')
        })
    })
    .catch(console.error)
})
// Readiness is recoverable even if Chrome terminates the worker mid-upgrade.
void db
  .open()
  .then(() => runMaintenance())
  .catch(console.error)
