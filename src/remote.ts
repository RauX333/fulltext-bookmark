import type { Settings } from './settings'
import type { PageInput } from './types'
import { normalizeUrl } from './identity'
import { t } from './i18n'

export async function sendRemote(settings: Settings, data: PageInput) {
  if (!settings.remoteStoreURL.trim())
    throw new Error(t('请先填写 API 地址', 'Enter an API URL first'))
  const url = normalizeUrl(settings.remoteStoreURL.trim())
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.remoteStoreKey
          ? { Authorization: `Bearer ${settings.remoteStoreKey}` }
          : {})
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(10000),
      credentials: 'omit',
      redirect: 'error'
    })
    if (!response.ok)
      throw new Error(
        t(
          `服务器返回 HTTP ${response.status}`,
          `Server returned HTTP ${response.status}`
        )
      )
    return response.status
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError')
      throw new Error(
        t('连接超时（10 秒）', 'Connection timed out after 10 seconds')
      )
    if (error instanceof TypeError)
      throw new Error(
        t(
          '连接失败，请检查网址、网络和服务器跨域配置',
          'Connection failed. Check the URL, network and server configuration.'
        )
      )
    throw error
  }
}
export async function testRemote(settings: Settings) {
  // Send only a clearly identified synthetic record, never browsing data.
  const status = await sendRemote(settings, {
    url: 'https://example.com/fulltext-bookmark-connection-test',
    title: 'Fulltext Bookmark connection test',
    date: Date.now(),
    isBookmarked: false
  })
  return t(
    `连接成功（HTTP ${status}）`,
    `Connection successful (HTTP ${status})`
  )
}
