import React from 'react'
import { SearchView } from './SearchView'
// Chrome computes action-popup size from its contents. A 100vw/100vh ceiling
// creates a feedback loop at its initial tiny viewport and prevents expansion.
// A tab preview still uses responsive viewport constraints; the actual action
// popup is bounded by the screen, not by that initial popup viewport.
void chrome.tabs.getCurrent().then((tab) => {
  if (tab) return
  const root = document.documentElement
  root.classList.add('action-popup')
  root.style.setProperty(
    '--popup-width',
    `${Math.min(400, screen.availWidth)}px`
  )
  root.style.setProperty(
    '--popup-height',
    `${Math.min(600, screen.availHeight)}px`
  )
})
export default function Popup() {
  return <SearchView popup />
}
