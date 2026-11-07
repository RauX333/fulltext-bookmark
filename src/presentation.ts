import { getSettings, type Settings } from './settings'

export async function configureAction(settings: Settings) {
  const panel = !!chrome.sidePanel?.setPanelBehavior
  await chrome.action.setPopup({
    popup:
      settings.searchDisplay === 'popup' ||
      (!panel && settings.searchDisplay === 'sidepanel')
        ? 'popup.html'
        : ''
  })
  if (panel)
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: settings.searchDisplay === 'sidepanel'
    })
}

export async function openSearchPopup(query: string, windowId?: number) {
  // A one-off popup must not change the user's default icon behavior.
  if (windowId !== undefined && typeof chrome.sidePanel?.close === 'function')
    await chrome.sidePanel.close({ windowId }).catch(() => {})
  if (windowId !== undefined)
    await chrome.windows.update(windowId, { focused: true })
  if (chrome.sidePanel?.setPanelBehavior)
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
  await chrome.action.setPopup({
    popup: `popup.html?q=${encodeURIComponent(query)}`
  })
  try {
    await chrome.action.openPopup(windowId ? { windowId } : {})
  } finally {
    await configureAction(await getSettings())
  }
}
