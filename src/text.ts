import { stemmer } from 'stemmer'
import { eng, zho } from 'stopword'
import { Converter } from 'opencc-js/t2cn'
import { aliasTokens, canonicalQuery } from './aliases'
const simplified = Converter({ from: 't', to: 'cn' })
const segmenter = new Intl.Segmenter('zh', { granularity: 'word' })
export const englishStop = new Set(
  'a an the of to in on at by for from with as and or but is are was were be been being it its this that these those i you he she we they me my your our their do does did have has had will would can could shall should may might very just also about into than then so not no'.split(
    ' '
  )
)
export const chineseStop = new Set(
  '的 地 得 了 吗 呢 啊 吧 呀 嘛 是 在 和 与 及 或 而 也 都 就 又 很 被 把 对 于 以 这 那 一个 一些 我 你 他 她 它 我们 你们 他们 什么 怎么 如何 为什么 是否'.split(
    ' '
  )
)
// Never remove negation, even if an upstream list classifies it as a stop word.
for (const word of eng)
  if (!['no', 'not', 'nor', 'never', 'without'].includes(word))
    englishStop.add(word)
for (const word of zho)
  if (!['不', '没', '没有', '无', '非', '未', '别'].includes(word))
    chineseStop.add(word)
for (const word of ['not', 'no']) englishStop.delete(word)
export function normalize(text: string) {
  const value = text
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  // Only Chinese runs need dictionary conversion. Passing a whole long mixed
  // English/Chinese page through OpenCC made common-word ranking unnecessarily slow.
  return value.replace(/\p{Script=Han}+/gu, (run) => simplified(run))
}
function lexical(text: string) {
  return normalize(text)
    .replace(/\b(?:[a-z]\.){2,}[a-z]?\.?/g, (value) => value.replace(/\./g, ''))
    .replace(/[’‘]/g, "'")
    .replace(/\bcan't\b/g, 'can not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\b([a-z]+)n't\b/g, '$1 not')
    .replace(/\b(i)'m\b/g, '$1 am')
    .replace(/\b([a-z]+)'re\b/g, '$1 are')
    .replace(/\b([a-z]+)'ve\b/g, '$1 have')
    .replace(/\b([a-z]+)'ll\b/g, '$1 will')
    .replace(/\b([a-z]+)'s\b/g, '$1')
}
export function words(text: string): string[] {
  return Array.from(segmenter.segment(lexical(text)), (part) =>
    part.isWordLike ? part.segment : ''
  ).filter(Boolean)
}
export function isStop(word: string) {
  return englishStop.has(word) || chineseStop.has(word)
}
export function indexWords(text: string): string[] {
  const terms = new Set<string>(aliasTokens(lexical(text)))
  for (const word of words(text)) {
    terms.add(word)
    if (/^[a-z]{3,}$/.test(word)) terms.add('~' + stemmer(word))
  }
  for (const match of normalize(text).matchAll(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu
  )) {
    const chars = Array.from(match[0])
    chars.forEach((c, i) => {
      terms.add(c)
      if (i) terms.add(chars[i - 1] + c)
    })
  }
  return [...terms]
}
export function queryWords(text: string) {
  const all = words(canonicalQuery(lexical(text)))
  const important = all.filter((word) => !isStop(word))
  return [...new Set(important.length ? important : all)].slice(0, 24)
}
export function stem(word: string) {
  return /^[a-z]{3,}$/.test(word) ? '~' + stemmer(word) : word
}
export function deletions(word: string): string[] {
  const keys = new Set([word])
  for (let i = 0; i < word.length; i++)
    keys.add(word.slice(0, i) + word.slice(i + 1))
  return [...keys]
}
export function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  )
  rows.forEach((row, i) => {
    row[0] = i
  })
  rows[0].forEach((_, j) => {
    rows[0][j] = j
  })
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1])
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1)
    }
  return rows[a.length][b.length]
}
export { hashText, normalizeUrl } from './identity'
export function makeSnippet(
  content: string,
  terms: string[],
  length = 240
): string {
  const text = content.replace(/\s+/g, ' ').trim()
  const folded = normalize(text)
  const positions = terms
    .map((t) => folded.indexOf(normalize(t)))
    .filter((p) => p >= 0)
  const start = Math.max(
    0,
    (positions.length ? Math.min(...positions) : 0) - 65
  )
  return `${start ? '…' : ''}${text.slice(start, start + length)}${text.length > start + length ? '…' : ''}`
}
