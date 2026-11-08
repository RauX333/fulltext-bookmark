// Reloading an extension leaves its old content scripts in open documents, but
// Chrome invalidates their APIs. Retire that world on its next callback.
let stopped = false
const cleanups = new Set<() => void>()

export function contentContextActive(): boolean {
  if (stopped) return false
  try {
    if (chrome.runtime?.id) return true
  } catch {
    // Some Chrome bindings throw instead of returning an absent runtime ID.
  }
  stopped = true
  for (const cleanup of cleanups) {
    try {
      cleanup()
    } catch {
      // An invalid Chrome event binding must not prevent other DOM cleanup.
    }
  }
  cleanups.clear()
  return false
}

export function onContentInvalidated(cleanup: () => void) {
  if (contentContextActive()) cleanups.add(cleanup)
  else cleanup()
}
