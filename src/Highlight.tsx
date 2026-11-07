import React from 'react'
import { normalize } from './text'

// Highlight normalized matches without altering the archived spelling, accents or
// traditional Chinese characters displayed to the user.
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>
  const folded = normalize(text)
  const starts: number[] = [],
    ends: number[] = []
  let offset = 0
  for (const char of text) {
    const normalized = normalize(char)
    for (let i = 0; i < normalized.length; i++) {
      starts.push(offset)
      ends.push(offset + char.length)
    }
    offset += char.length
  }
  const ranges: [number, number][] = []
  for (const term of new Set(terms.map(normalize).filter(Boolean))) {
    let at = -1
    while ((at = folded.indexOf(term, at + 1)) >= 0)
      ranges.push([
        starts[at] ?? at,
        ends[at + term.length - 1] ?? at + term.length
      ])
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const range of ranges) {
    const last = merged.at(-1)
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([...range])
  }
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    parts.push(
      text.slice(cursor, start),
      <mark key={start}>{text.slice(start, end)}</mark>
    )
    cursor = end
  }
  parts.push(text.slice(cursor))
  return <>{parts}</>
}
