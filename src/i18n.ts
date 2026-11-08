let language = 'auto'
let uiLanguage: string | undefined
function browserLanguage() {
  if (uiLanguage) return uiLanguage
  try {
    uiLanguage =
      typeof chrome !== 'undefined' ? chrome.i18n.getUILanguage() : 'zh-CN'
  } catch {
    // UI callbacks already in flight can outlive an extension reload.
    uiLanguage = typeof navigator !== 'undefined' ? navigator.language : 'zh-CN'
  }
  return uiLanguage
}
export function setLanguage(value: string) {
  language = value
}
export const t = (chinese: string, english: string) => {
  const locale = language === 'auto' ? browserLanguage() : language
  return locale.startsWith('zh') ? chinese : english
}
