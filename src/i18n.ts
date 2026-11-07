let language = 'auto'
export function setLanguage(value: string) {
  language = value
}
export const t = (chinese: string, english: string) => {
  const locale =
    language === 'auto'
      ? typeof chrome !== 'undefined'
        ? chrome.i18n.getUILanguage()
        : 'zh-CN'
      : language
  return locale.startsWith('zh') ? chinese : english
}
