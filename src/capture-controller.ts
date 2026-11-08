import { extractVisibleText, SeenText } from './capture'
import { allowsAutomaticCapture, isExcluded, type Settings } from './settings'
import { hashText, normalizeUrl } from './identity'
import { installWeiboButtons } from './weibo'
import { installTwitterButtons } from './twitter'
import { installChatGPT } from './chatgpt'
import { installGemini } from './gemini'
import { installDeepSeek } from './deepseek'
import { installSearchCompanion } from './search-companion'
import { pageTitle } from './adapters'
import { setLanguage } from './i18n'
import { contentContextActive, onContentInvalidated } from './content-context'

let settings: Settings
let timer = 0,
  maxTimer = 0,
  lastCapture = 0,
  generation = 0,
  running = false,
  rerun = false
let currentUrl = normalizeUrl(location.href),
  seen = new SeenText(),
  lastHash = '',
  bookmarked = false
const observed = new WeakSet<Node>()
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
function enabled() {
  return (
    contentContextActive() &&
    settings &&
    allowsAutomaticCapture(location.href, settings) &&
    !isExcluded(location.href, settings.forbiddenURLs) &&
    (settings.storeEveryPage || (settings.bookmarkAdaption && bookmarked))
  )
}
function observe(root: Node) {
  if (observed.has(root)) return
  observed.add(root)
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'open', 'src']
  })
}
function resetRoute() {
  if (!contentContextActive()) return false
  const nextUrl = normalizeUrl(location.href)
  if (currentUrl === nextUrl) return false
  currentUrl = nextUrl
  generation++
  seen = new SeenText()
  lastHash = ''
  bookmarked = false
  void refreshConfiguration().catch(() => {})
  return true
}
function schedule() {
  if (!contentContextActive()) return
  resetRoute()
  if (!enabled()) return
  clearTimeout(timer)
  const delay = Math.max(700, 2500 - (Date.now() - lastCapture))
  timer = window.setTimeout(() => void capture(), delay)
  if (!maxTimer) maxTimer = window.setTimeout(() => void capture(), 5000)
}
async function capture(force = false) {
  if (!contentContextActive()) return
  clearTimeout(timer)
  clearTimeout(maxTimer)
  maxTimer = 0
  resetRoute()
  if (!force && !enabled()) return
  if (!allowsAutomaticCapture(location.href, settings)) return
  if (isExcluded(location.href, settings.forbiddenURLs)) return
  if (running) {
    rerun = true
    return
  }
  running = true
  const route = generation,
    url = location.href
  try {
    const result = await extractVisibleText(
      document,
      () =>
        !contentContextActive() || generation !== route || location.href !== url
    )
    if (
      !contentContextActive() ||
      generation !== route ||
      location.href !== url ||
      !result.text
    )
      return
    result.roots.forEach(observe)
    const content = seen.add(result.text, !!result.profile)
    const title = pageTitle(document, location.hostname)
    const hash = hashText(title + '\n' + content)
    if (hash === lastHash && !force) return
    const response = await chrome.runtime.sendMessage({
      command: 'capture',
      data: {
        url,
        title,
        content,
        date: Date.now(),
        truncated: result.truncated || seen.truncated,
        captureProfile: result.profile
      }
    })
    if (response?.ok && response.saved) lastHash = hash
  } catch {
    /* discarded extension context or transient storage error: retry on next change */
  } finally {
    lastCapture = Date.now()
    running = false
    if (rerun) {
      rerun = false
      schedule()
    }
  }
}
async function refreshConfiguration() {
  if (!contentContextActive()) return
  const response = await chrome.runtime.sendMessage({
    command: 'capture-config',
    url: location.href
  })
  if (!contentContextActive() || !response?.ok) return
  settings = response.settings
  setLanguage(settings.language)
  bookmarked = response.bookmarked
  if (enabled()) schedule()
}
chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message.command === 'route-changed') {
    resetRoute()
    void refreshConfiguration()
      .then(schedule)
      .catch(() => {})
  }
  if (message.command === 'capture-now') {
    void refreshConfiguration()
      .then(() => capture(true))
      .then(
        () => respond({ ok: true }),
        (error) => respond({ ok: false, error: String(error) })
      )
    return true
  }
})
void refreshConfiguration()
  .then(() => {
    if (!contentContextActive()) return
    // Access checks and client-side shells can replace the entire <html> node.
    // Keep observing the Document so the article inserted afterwards is captured.
    observe(document)
    installWeiboButtons(
      () =>
        settings?.weiboSupport &&
        !isExcluded(location.href, settings.forbiddenURLs)
    )
    installTwitterButtons(
      () =>
        settings?.twitterSupport &&
        !isExcluded(location.href, settings.forbiddenURLs)
    )
    installSearchCompanion(() => settings?.searchEngineAdaption)
    installChatGPT(
      () =>
        settings?.chatgptSupport &&
        !isExcluded(location.href, settings.forbiddenURLs),
      () => settings?.chatgptAutoCapture
    )
    installGemini(
      () =>
        settings?.geminiSupport &&
        !isExcluded(location.href, settings.forbiddenURLs),
      () => settings?.geminiAutoCapture
    )
    installDeepSeek(
      () =>
        settings?.deepseekSupport &&
        !isExcluded(location.href, settings.forbiddenURLs),
      () => settings?.deepseekAutoCapture
    )
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    window.addEventListener('popstate', schedule)
    window.addEventListener('hashchange', schedule)
    window.addEventListener('pageshow', schedule)
    const visibilityChanged = () => {
      if (document.visibilityState === 'hidden') void capture()
      else schedule()
    }
    document.addEventListener('visibilitychange', visibilityChanged)
    document.addEventListener('load', schedule, true)
    onContentInvalidated(() => {
      generation++
      rerun = false
      clearTimeout(timer)
      clearTimeout(maxTimer)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('popstate', schedule)
      window.removeEventListener('hashchange', schedule)
      window.removeEventListener('pageshow', schedule)
      document.removeEventListener('visibilitychange', visibilityChanged)
      document.removeEventListener('load', schedule, true)
    })
    // Storage events also update options on tabs opened before a settings change.
    chrome.storage.onChanged.addListener(() => {
      void refreshConfiguration().catch(() => {})
    })
  })
  .catch(() => {})
