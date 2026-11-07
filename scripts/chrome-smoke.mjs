import { chromium } from '@playwright/test'
import { resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'
await mkdir('test-results', { recursive: true })
const context = await chromium.launchPersistentContext(
  'test-results/chrome-profile',
  {
    channel: 'chrome',
    headless: true,
    args: ['--enable-unsafe-extension-debugging'],
    ignoreDefaultArgs: ['--disable-extensions']
  }
)
try {
  console.log('Chrome version', context.browser()?.version())
  const session = await context.browser().newBrowserCDPSession()
  const result = await session.send('Extensions.loadUnpacked', {
    path: resolve('build/chrome-mv3-prod')
  })
  console.log(
    JSON.stringify({ browser: context.browser()?.version(), extension: result })
  )
  const page = await context.newPage()
  page.on('pageerror', (error) => console.log('PAGEERROR', error.message))
  await page.goto(`chrome-extension://${result.id}/popup.html`)
  await page.waitForTimeout(1000)
  console.log((await page.locator('body').innerText()).slice(0, 2000))
  await page.screenshot({ path: 'test-results/chrome-popup.png' })
} finally {
  await context.close()
}
