import { t } from './i18n'
export async function send<T = Record<string, unknown>>(
  command: string,
  data: Record<string, unknown> = {}
): Promise<T> {
  const response = await chrome.runtime.sendMessage({ command, ...data })
  if (!response?.ok)
    throw new Error(
      response?.error ||
        t(
          '扩展未响应，请重新打开',
          'Extension did not respond. Please reopen it.'
        )
    )
  return response as T
}
