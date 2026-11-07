import type { PlasmoCSConfig } from 'plasmo'
import '../capture-controller'
export const config: PlasmoCSConfig = {
  matches: ['http://*/*', 'https://*/*'],
  run_at: 'document_idle',
  all_frames: false
}
