import { isTwitterHost } from './twitter-url'
import { chatSiteForHost } from './chatgpt-data'

export const SETTINGS_KEY = 'settings.v2'
export const LEGACY_KEY = 'persist:fulltextbookmark'
export const defaults = {
  language: 'auto' as 'auto' | 'zh-CN' | 'en',
  searchDisplay: 'sidepanel' as 'sidepanel' | 'popup' | 'tab',
  storeEveryPage: true,
  bookmarkAdaption: true,
  searchEngineAdaption: true,
  showOnlyBookmarkedResults: false,
  weiboSupport: true,
  weiboAutoCapture: false,
  twitterSupport: true,
  twitterAutoCapture: false,
  chatgptSupport: true,
  chatgptAutoCapture: true,
  geminiSupport: true,
  geminiAutoCapture: true,
  deepseekSupport: true,
  deepseekAutoCapture: true,
  omniboxEnabled: true,
  tempPageExpireTime: 60 * 86400000,
  maxResults: 30,
  forbiddenURLs: [
    'https://www.google.com/*',
    'https://www.bing.com/*',
    'https://cn.bing.com/*',
    'https://www.baidu.com/*',
    // Webmail is private by default. Keep these rules editable like other exclusions.
    '*://mail.google.com/*',
    '*://outlook.live.com/*',
    '*://outlook.office.com/*',
    '*://outlook.office365.com/*',
    '*://outlook.cloud.microsoft/*',
    '*://partner.outlook.cn/*',
    '*://mail.qq.com/*',
    '*://*.mail.qq.com/*',
    '*://exmail.qq.com/*',
    '*://*.exmail.qq.com/*',
    '*://mail.163.com/*',
    '*://mail.126.com/*',
    '*://mail.yeah.net/*',
    '*://mail.188.com/*',
    '*://vip.163.com/*',
    '*://vip.126.com/*',
    '*://vip.188.com/*',
    '*://mail.sina.com.cn/*',
    '*://mail.sina.cn/*',
    '*://mail.sohu.com/*',
    '*://mail.aliyun.com/*',
    '*://qiye.aliyun.com/*',
    '*://mail.10086.cn/*',
    '*://*.mail.10086.cn/*',
    '*://webmail.189.cn/*',
    '*://mail.yahoo.com/*',
    '*://*.mail.yahoo.com/*',
    '*://mail.aol.com/*',
    '*://mail.proton.me/*',
    '*://mail.protonmail.com/*',
    '*://app.fastmail.com/*',
    '*://app.tuta.com/*',
    '*://mail.tutanota.com/*',
    '*://mail.zoho.com/*',
    '*://mail.zoho.eu/*',
    '*://mail.zoho.in/*',
    '*://mail.zoho.com.cn/*',
    // iCloud shares its host with other apps; exclude only the Mail route.
    '/^https?:\\/\\/(www\\.|beta\\.)?icloud\\.com(\\.cn)?\\/mail([/?#]|$)/'
  ],
  fuzzySearch: true,
  remoteStore: false,
  remoteStoreEveryPage: false,
  remoteStoreURL: '',
  remoteStoreKey: ''
}
export type Settings = typeof defaults

export function allowsAutomaticCapture(
  url: string,
  settings: Settings
): boolean {
  const host = new URL(url).hostname
  // Chat sites use their own message-aware, completion-gated capture path.
  if (chatSiteForHost(host)) return false
  if (/(^|\.)weibo\.(com|cn)$/.test(host))
    return settings.weiboSupport && settings.weiboAutoCapture
  if (isTwitterHost(host))
    return settings.twitterSupport && settings.twitterAutoCapture
  return true
}

export function migrateSettings(raw: unknown): Settings {
  let data: Record<string, unknown> = {}
  try {
    data =
      typeof raw === 'string'
        ? JSON.parse(raw)
        : (raw as Record<string, unknown>) || {}
  } catch {
    /* damaged settings use defaults, originals remain intact */
  }
  const output = { ...defaults }
  for (const key of Object.keys(defaults) as (keyof Settings)[]) {
    let value = data[key]
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch {
        /* plain string */
      }
    }
    if (typeof value === typeof defaults[key])
      (output as Record<string, unknown>)[key] = value
  }
  output.forbiddenURLs = Array.isArray(data.forbiddenURLs)
    ? data.forbiddenURLs.filter((s): s is string => typeof s === 'string')
    : output.forbiddenURLs
  if (!Array.isArray(output.forbiddenURLs))
    output.forbiddenURLs = [...defaults.forbiddenURLs]
  output.maxResults = Math.max(
    5,
    Math.min(100, Number(output.maxResults) || 30)
  )
  output.tempPageExpireTime =
    Number.isFinite(output.tempPageExpireTime) && output.tempPageExpireTime >= 0
      ? output.tempPageExpireTime
      : defaults.tempPageExpireTime
  if (!['auto', 'zh-CN', 'en'].includes(output.language))
    output.language = 'auto'
  if (!['sidepanel', 'popup', 'tab'].includes(output.searchDisplay))
    output.searchDisplay = 'sidepanel'
  return output
}
let pending: Promise<Settings> | undefined
export function getSettings(): Promise<Settings> {
  return (pending ??= chrome.storage.local
    .get([SETTINGS_KEY, LEGACY_KEY])
    .then(async (values) => {
      const settings = migrateSettings(
        values[SETTINGS_KEY] ?? values[LEGACY_KEY]
      )
      if (!values[SETTINGS_KEY])
        await chrome.storage.local.set({ [SETTINGS_KEY]: settings })
      return settings
    }))
}
export async function saveSettings(value: Settings) {
  const settings = migrateSettings(value)
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings })
  pending = Promise.resolve(settings)
  return settings
}
if (typeof chrome !== 'undefined' && chrome.storage?.onChanged)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SETTINGS_KEY]) pending = undefined
  })

export function isExcluded(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const value = pattern.trim()
    if (!value) return false
    // Old releases treated patterns as regex. Keep explicit regex patterns working;
    // ordinary URL patterns use literal characters and * wildcards.
    try {
      if (value.startsWith('/') && value.endsWith('/'))
        return new RegExp(value.slice(1, -1), 'i').test(url)
      if (value.includes('.*') || value.startsWith('^'))
        return new RegExp(value, 'i').test(url)
      return new RegExp(
        '^' +
          value
            .split('*')
            .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('.*'),
        'i'
      ).test(url)
    } catch {
      return false
    }
  })
}
