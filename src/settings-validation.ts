import { t } from './i18n'
import { defaults, type Settings } from './settings'

export function settingError(key: keyof Settings, settings: Settings): string {
  const value = settings[key]
  if (typeof value !== typeof defaults[key])
    return t('设置值的格式不正确。', 'Invalid setting value.')
  if (
    key === 'maxResults' &&
    (!Number.isInteger(settings.maxResults) ||
      settings.maxResults < 5 ||
      settings.maxResults > 100)
  )
    return t(
      '每页结果数量必须是 5–100 的整数。',
      'Results per page must be an integer from 5 to 100.'
    )
  if (key === 'tempPageExpireTime') {
    const days = settings.tempPageExpireTime / 86400000
    if (!Number.isInteger(days) || days < 0 || days > 36500)
      return t(
        '保留天数必须是 0–36500 的整数，0 表示永久保存。',
        'Retention must be an integer from 0 to 36500 days; 0 means forever.'
      )
  }
  if (
    key === 'remoteStoreURL' ||
    (key === 'remoteStore' && settings.remoteStore)
  ) {
    const url = settings.remoteStoreURL.trim()
    if (!url)
      return settings.remoteStore
        ? t(
            '请先填写有效的 API 地址，再启用自定义 API。',
            'Enter a valid API URL before enabling the custom API.'
          )
        : ''
    try {
      const parsed = new URL(url)
      if (
        !['http:', 'https:'].includes(parsed.protocol) ||
        parsed.username ||
        parsed.password ||
        /\s/.test(url)
      )
        throw new Error()
    } catch {
      return t(
        'API 地址必须是完整的 HTTP(S) 网址，且不能包含用户名或密码。',
        'API URL must be a complete HTTP(S) URL without a username or password.'
      )
    }
  }
  if (
    key === 'remoteStoreKey' &&
    /[\u0000-\u001f\u007f]/.test(settings.remoteStoreKey)
  )
    return t(
      'API 密钥不能包含换行或控制字符。',
      'API key cannot contain line breaks or control characters.'
    )
  if (key === 'forbiddenURLs') {
    if (!Array.isArray(value) || value.some((line) => typeof line !== 'string'))
      return t(
        '排除规则必须每行填写一条。',
        'Enter one exclusion rule per line.'
      )
    for (const [index, raw] of settings.forbiddenURLs.entries()) {
      const rule = raw.trim()
      if (!rule) continue
      try {
        if (rule.startsWith('/')) {
          if (!rule.endsWith('/') || rule.length < 3) throw new Error()
          new RegExp(rule.slice(1, -1), 'i')
        } else if (rule.includes('.*') || rule.startsWith('^')) {
          new RegExp(rule, 'i')
        } else if (
          /\s|[\u0000-\u001f]/.test(rule) ||
          (/^[\w-]+:/.test(rule) && !/^https?:\/\//i.test(rule))
        )
          throw new Error()
      } catch {
        return t(
          `第 ${index + 1} 行排除规则无效。请使用网址、* 通配符或 /正则表达式/。`,
          `Exclusion rule on line ${index + 1} is invalid. Use a URL, * wildcards, or /regular expression/.`
        )
      }
    }
  }
  if (
    key === 'language' &&
    !['auto', 'zh-CN', 'en'].includes(settings.language)
  )
    return t('不支持这个界面语言。', 'Unsupported interface language.')
  if (
    key === 'searchDisplay' &&
    !['sidepanel', 'popup', 'tab'].includes(settings.searchDisplay)
  )
    return t('不支持这个搜索界面。', 'Unsupported search view.')
  return ''
}
