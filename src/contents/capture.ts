import type { PlasmoCSConfig } from 'plasmo'
import '../capture-controller'
export const config: PlasmoCSConfig = {
  matches: ['http://*/*', 'https://*/*'],
  exclude_matches: [
    '*://*.bbc.com/*',
    '*://*.bbc.co.uk/*',
    '*://kotlinlang.org/docs/*',
    '*://*.searchenginejournal.com/*'
  ],
  run_at: 'document_idle',
  all_frames: false
}
