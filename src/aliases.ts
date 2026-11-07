// Conservative, explicit equivalences. Ambiguous initials (for example PM) are
// deliberately not expanded. A full phrase in quotes bypasses this mapping.
const groups = [
  ['javascript', 'js', 'java script'],
  ['typescript', 'ts', 'type script'],
  ['api', 'application programming interface', '应用程序编程接口'],
  ['sdk', 'software development kit', '软件开发工具包'],
  ['html', 'hypertext markup language', '超文本标记语言'],
  ['css', 'cascading style sheets', '层叠样式表'],
  ['http', 'hypertext transfer protocol', '超文本传输协议'],
  ['https', 'hypertext transfer protocol secure'],
  ['url', 'uniform resource locator', '统一资源定位符'],
  ['cpu', 'central processing unit', '中央处理器'],
  ['gpu', 'graphics processing unit', '图形处理器'],
  ['ui', 'user interface', '用户界面'],
  ['ux', 'user experience', '用户体验'],
  ['sql', 'structured query language', '结构化查询语言'],
  ['usa', 'united states of america'],
  ['uk', 'united kingdom']
]
const lookup = new Map(
  groups.flatMap((group) => group.map((alias) => [alias, group[0]] as const))
)
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const entries = [...lookup]
  .sort(([a], [b]) => b.length - a.length)
  .map(([alias, canonical]) => ({
    alias,
    canonical,
    pattern: new RegExp(`(?<![a-z0-9])${escaped(alias)}(?![a-z0-9])`, 'g')
  }))
export function aliasToken(word: string) {
  const canonical = lookup.get(word)
  return canonical ? '@alias:' + canonical : undefined
}
export function canonicalQuery(text: string) {
  for (const { pattern, canonical } of entries)
    text = text.replace(pattern, canonical)
  return text
}
export function aliasTokens(text: string) {
  const found = new Set<string>()
  for (const { pattern, canonical } of entries) {
    pattern.lastIndex = 0
    if (pattern.test(text)) found.add('@alias:' + canonical)
  }
  return [...found]
}
export function aliasMatch(text: string, token: string) {
  const canonical = token.replace('@alias:', '')
  for (const entry of entries)
    if (entry.canonical === canonical) {
      entry.pattern.lastIndex = 0
      if (entry.pattern.test(text)) return entry.alias
    }
  return canonical
}
