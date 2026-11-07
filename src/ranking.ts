import { normalize } from './text'
type Field = 'titleWords' | 'contentWords' | 'urlWords'
const boost: Record<Field, number> = {
  titleWords: 8,
  contentWords: 2.5,
  urlWords: 1
}
// Bounded frequency and minimum-covering-window proximity reward coherent passages,
// without letting repeated boilerplate or a very long document dominate the ranking.
export function relevanceBoost(
  texts: Record<Field, string>,
  fieldHits: Partial<Record<Field, Set<string>>>,
  termCount: number,
  date: number
) {
  let score = 0
  for (const field of Object.keys(fieldHits) as Field[]) {
    const text = normalize(texts[field]),
      hits = [...fieldHits[field]!]
    const occurrences: { start: number; end: number; term: number }[] = []
    let frequency = 0
    hits.forEach((hit, term) => {
      let start = -1,
        count = 0
      while (count < 16 && (start = text.indexOf(hit, start + 1)) >= 0) {
        const latin = /^[a-z0-9]+$/.test(hit)
        if (
          latin &&
          (/[a-z0-9]/.test(text[start - 1] || '') ||
            /[a-z0-9]/.test(text[start + hit.length] || ''))
        )
          continue
        occurrences.push({ start, end: start + hit.length, term })
        count++
      }
      // A saturating TF component: 16 repetitions are only ~2x one occurrence.
      frequency += count ? (count * 2.2) / (count + 1.2) : 0
    })
    score += (boost[field] * 0.15 * frequency) / Math.max(1, termCount)
    if (hits.length < termCount || termCount < 2) continue
    occurrences.sort((a, b) => a.start - b.start)
    const counts = new Map<number, number>()
    let left = 0,
      span = Infinity
    for (let right = 0; right < occurrences.length; right++) {
      const current = occurrences[right]
      counts.set(current.term, (counts.get(current.term) || 0) + 1)
      while (counts.size === hits.length) {
        span = Math.min(span, current.end - occurrences[left].start)
        const term = occurrences[left++].term,
          count = counts.get(term)! - 1
        if (count) counts.set(term, count)
        else counts.delete(term)
      }
    }
    if (Number.isFinite(span)) {
      const length = hits.reduce((sum, hit) => sum + hit.length, 0)
      score += boost[field] * Math.min(1, length / Math.max(length, span))
      if (field === 'titleWords') score += 3
    }
  }
  // Recency is only a tie-breaker, never a substitute for textual relevance.
  return score + 0.15 / (1 + Math.max(0, Date.now() - date) / (90 * 86400000))
}
