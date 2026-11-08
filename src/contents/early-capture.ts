import type { PlasmoCSConfig } from 'plasmo'
import '../capture-controller'

// These sites can render articles while a blocking resource keeps
// DOMContentLoaded pending. Start observing there before document_idle. The normal
// entrypoint excludes these hosts so observers and message handlers install once.
export const config: PlasmoCSConfig = {
  matches: [
    '*://*.bbc.com/*',
    '*://*.bbc.co.uk/*',
    '*://kotlinlang.org/docs/*',
    '*://*.searchenginejournal.com/*'
  ],
  run_at: 'document_start',
  all_frames: false
}
