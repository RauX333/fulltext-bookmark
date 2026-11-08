import { test, expect, chromium } from '@playwright/test'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

test('actual Chrome toolbar popup grows to 400 x 600 and keeps arrow pagination', async () => {
  const context = await chromium.launchPersistentContext(
    await mkdtemp(join(tmpdir(), 'ftb-popup-profile-')),
    {
      channel: 'chrome',
      headless: false,
      args: ['--enable-unsafe-extension-debugging'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  try {
    const session = await context.browser()!.newBrowserCDPSession()
    const { id } = await session.send('Extensions.loadUnpacked', {
      path: resolve('build/chrome-mv3-prod')
    })
    const page = await context.newPage()
    await page.goto(`chrome-extension://${id}/tabs/search.html`)
    expect(
      (
        await page.evaluate(() =>
          chrome.runtime.sendMessage({ command: 'settings' })
        )
      ).settings.searchDisplay
    ).toBe('sidepanel')
    await page.evaluate(async () => {
      const response = await chrome.runtime.sendMessage({ command: 'settings' })
      await chrome.runtime.sendMessage({
        command: 'save-settings',
        settings: {
          ...response.settings,
          searchDisplay: 'popup',
          maxResults: 5
        }
      })
      for (let i = 0; i < 8; i++)
        await chrome.bookmarks.create({
          title: 'Popup fixture ' + i,
          url: 'https://popup-fixture.test/' + i
        })
    })
    await expect
      .poll(
        async () =>
          (
            await page.evaluate(() =>
              chrome.runtime.sendMessage({
                command: 'search',
                request: { query: 'fixture' }
              })
            )
          ).total
      )
      .toBe(8)
    const tabs = (
      await session.send('Target.getTargets', {
        filter: [{ type: 'tab', exclude: false }, { exclude: true }]
      })
    ).targetInfos
    await session.send('Extensions.triggerAction', {
      id,
      targetId: tabs.find((t) => t.url === page.url())!.targetId
    })
    let popupId = ''
    await expect
      .poll(async () => {
        popupId =
          (await session.send('Target.getTargets')).targetInfos.find(
            (t) => t.url === `chrome-extension://${id}/popup.html`
          )?.targetId || ''
        return !!popupId
      })
      .toBe(true)
    let attached = await session.send('Target.attachToTarget', {
      targetId: popupId,
      flatten: false
    })
    let serial = 0
    const call = (
      method: string,
      params: Record<string, unknown> = {}
    ): Promise<any> =>
      new Promise((resolve, reject) => {
        const id = ++serial
        const timeout = setTimeout(() => {
          session.off('Target.receivedMessageFromTarget', listener)
          reject(new Error('Popup command timeout'))
        }, 5000)
        const listener = (event: { sessionId: string; message: string }) => {
          if (event.sessionId !== attached.sessionId) return
          const message = JSON.parse(event.message)
          if (message.id !== id) return
          clearTimeout(timeout)
          session.off('Target.receivedMessageFromTarget', listener)
          if (message.error) reject(message.error)
          else resolve(message.result)
        }
        session.on('Target.receivedMessageFromTarget', listener)
        void session
          .send('Target.sendMessageToTarget', {
            sessionId: attached.sessionId,
            message: JSON.stringify({ id, method, params })
          })
          .catch(reject)
      })
    await expect
      .poll(
        async () =>
          (
            await call('Runtime.evaluate', {
              expression: 'JSON.stringify([innerWidth,innerHeight])',
              returnByValue: true
            })
          ).result.value
      )
      .toBe('[400,600]')
    const label = (
      await call('Runtime.evaluate', {
        expression: 'document.querySelector(".open-search-tab")?.textContent',
        returnByValue: true
      })
    ).result.value
    expect(label).toMatch(/在标签页中搜索|Search in a tab/)
    await expect
      .poll(
        async () =>
          (
            await call('Runtime.evaluate', {
              expression: 'document.querySelector(".pagination")?.textContent',
              returnByValue: true
            })
          ).result.value
      )
      .toMatch(/←.*→/s)
    const screenshot = await call('Page.captureScreenshot', { format: 'png' })
    await mkdir('test-results/evidence', { recursive: true })
    await writeFile(
      'test-results/evidence/native-popup.png',
      Buffer.from(screenshot.data, 'base64')
    )
  } finally {
    await context.close()
  }
})

test('toolbar supports side-panel, popup and tab preferences; explicit popup does not change the default', async () => {
  const context = await chromium.launchPersistentContext(
    await mkdtemp(join(tmpdir(), 'ftb-modes-profile-')),
    {
      channel: 'chrome',
      headless: false,
      args: ['--enable-unsafe-extension-debugging'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  try {
    const session = await context.browser()!.newBrowserCDPSession()
    const { id } = await session.send('Extensions.loadUnpacked', {
      path: resolve('build/chrome-mv3-prod')
    })
    const page = await context.newPage()
    await page.goto(`chrome-extension://${id}/tabs/search.html`)
    const tabs = (
      await session.send('Target.getTargets', {
        filter: [{ type: 'tab', exclude: false }, { exclude: true }]
      })
    ).targetInfos
    const targetId = tabs.find((t) => t.url === page.url())!.targetId
    await expect
      .poll(
        async () =>
          (await page.evaluate(() => chrome.sidePanel.getPanelBehavior()))
            .openPanelOnActionClick
      )
      .toBe(true)
    await session.send('Extensions.triggerAction', { id, targetId })
    await expect
      .poll(async () =>
        (await session.send('Target.getTargets')).targetInfos.some(
          (t) => t.url === `chrome-extension://${id}/sidepanel.html`
        )
      )
      .toBe(true)
    await page.locator('.search-box input').fill('carriedquery')
    await page.locator('.open-search-panel').click()
    expect(
      await page.evaluate(
        async () =>
          (await chrome.storage.session.get('sidepanelQuery')).sidepanelQuery
      )
    ).toMatchObject({ query: 'carriedquery' })
    await page.locator('.open-search-popup').click()
    await expect
      .poll(async () =>
        (await session.send('Target.getTargets')).targetInfos.some((t) =>
          t.url.includes('/popup.html?q=carriedquery')
        )
      )
      .toBe(true)
    expect(
      (
        await page.evaluate(() =>
          chrome.runtime.sendMessage({ command: 'settings' })
        )
      ).settings.searchDisplay
    ).toBe('sidepanel')
    await expect
      .poll(() => page.evaluate(() => chrome.action.getPopup({})))
      .toBe('')
    // Close the action popup naturally by clicking into the settings tab.
    const settings = await context.newPage()
    await settings.goto(`chrome-extension://${id}/options.html`)
    const mode = settings.getByLabel(/默认搜索界面|Default search view/)
    for (const value of ['popup', 'tab', 'sidepanel']) {
      await mode.selectOption(value)
      await expect(settings.getByTestId('settings-save-status')).toContainText(
        /设置已自动保存|Settings saved automatically/
      )
      expect(
        (
          await page.evaluate(() =>
            chrome.runtime.sendMessage({ command: 'settings' })
          )
        ).settings.searchDisplay
      ).toBe(value)
      expect(await page.evaluate(() => chrome.action.getPopup({}))).toBe(
        value === 'popup' ? `chrome-extension://${id}/popup.html` : ''
      )
      expect(
        (await page.evaluate(() => chrome.sidePanel.getPanelBehavior()))
          .openPanelOnActionClick
      ).toBe(value === 'sidepanel')
      if (value === 'tab') {
        const before = context
          .pages()
          .filter((p) => p.url().includes('/tabs/search.html')).length
        await session.send('Extensions.triggerAction', { id, targetId })
        await expect
          .poll(
            () =>
              context
                .pages()
                .filter((p) => p.url().includes('/tabs/search.html')).length
          )
          .toBeGreaterThan(before)
      }
    }
  } finally {
    await context.close()
  }
})
