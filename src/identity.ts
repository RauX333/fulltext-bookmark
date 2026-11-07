import { t } from './i18n'
export function hashText(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++)
    h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return `${text.length}:${h >>> 0}`
}
export function normalizeUrl(raw: string): string {
  const url = new URL(raw)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error(
      t('只支持 HTTP(S) 网页地址', 'Only HTTP(S) page URLs are supported')
    )
  // Hash routes are separate documents; ordinary anchors retain the legacy URL identity.
  if (!/^#(?:[!/]|.*[=?])/.test(url.hash)) url.hash = ''
  return url.href
}
