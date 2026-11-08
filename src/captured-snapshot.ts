// Keep the current article verbatim, including repeated table cells and code lines.
// Retain older, no-longer-rendered blocks after it for expanded/virtualized comments.
export function mergeArticleSnapshot(
  previous: string,
  incoming: string,
  limit: number
) {
  if (previous === incoming) return { text: incoming, truncated: false }
  const current = incoming.slice(0, limit)
  const known = new Set(current.split('\n').map((line) => line.trim()))
  const parts = [current]
  let length = current.length
  let truncated = incoming.length > limit
  for (const line of previous.split('\n')) {
    if (!line.trim() || known.has(line.trim())) continue
    if (length + line.length + 1 > limit) {
      truncated = true
      break
    }
    parts.push(line)
    known.add(line.trim())
    length += line.length + 1
  }
  return { text: parts.join('\n'), truncated }
}
