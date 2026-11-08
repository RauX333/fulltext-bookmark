import {
  test,
  expect,
  chromium,
  type BrowserContext,
  type Page
} from '@playwright/test'
import { mkdtemp, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

let context: BrowserContext, page: Page, extensionId: string
const errors: string[] = []
test.describe.configure({ mode: 'serial' })
test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(
    await mkdtemp(resolve(tmpdir(), 'ftb-search-help-')),
    {
      channel: 'chrome',
      headless: true,
      args: ['--enable-unsafe-extension-debugging'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  const session = await context.browser()!.newBrowserCDPSession()
  extensionId = (
    await session.send('Extensions.loadUnpacked', {
      path: resolve('build/chrome-mv3-prod')
    })
  ).id
  page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`chrome-extension://${extensionId}/tabs/search.html`)
  await page.evaluate(async () => {
    const { settings } = await chrome.runtime.sendMessage({
      command: 'settings'
    })
    await chrome.runtime.sendMessage({
      command: 'save-settings',
      settings: { ...settings, language: 'en', storeEveryPage: false }
    })
    for (const record of [
      {
        url: 'https://example.com/docs/browser',
        title: 'Browser history guide'
      },
      {
        url: 'https://docs.example.com/docs/mobile',
        title: 'Mobile browser guidebook'
      },
      {
        url: 'https://notexample.com/docs/browser',
        title: 'Browser history archive'
      }
    ])
      await chrome.bookmarks.create(record)
  })
  await expect
    .poll(
      async () =>
        (
          await page.evaluate(() =>
            chrome.runtime.sendMessage({
              command: 'search',
              request: { query: 'site:example.com' }
            })
          )
        ).total
    )
    .toBe(2)
  await mkdir('artifacts/search-syntax/evidence', { recursive: true })
})
test.afterAll(async () => {
  await context?.close()
})

test('advanced search works through the search UI and preserves strict conditions', async () => {
  const input = page.locator('.search-box input')
  for (const [query, count, title] of [
    ['site:example.com intitle:brow* -mobile', 1, 'Browser history guide'],
    ['"browser history guide"', 1, 'Browser history guide'],
    ['url:docs.example.com/*/mobile', 1, 'Mobile browser guidebook'],
    ['https://example.com/docs/browser', 1, 'Browser history guide'],
    ['site:example.com browser guide absentword', 0, '']
  ] as const) {
    await input.fill(query)
    await expect(page.locator('.result-card')).toHaveCount(count)
    if (title) await expect(page.locator('.result-title')).toHaveText(title)
    await expect(
      page.getByText('No pages match every keyword.', { exact: false })
    ).toHaveCount(0)
  }
})

test('help opens on hover, pins on click, supports keyboard and stays inside popup, side panel and tab', async () => {
  for (const [entry, width, height] of [
    ['popup.html', 360, 600],
    ['popup.html', 400, 600],
    ['sidepanel.html', 360, 760],
    ['tabs/search.html', 1280, 900]
  ] as const) {
    await page.setViewportSize({ width, height })
    await page.goto(`chrome-extension://${extensionId}/${entry}`)
    const help = page.getByRole('button', { name: 'Search help', exact: true })
    const panel = page.getByRole('dialog', { name: 'Search help' })
    await expect(help).toBeVisible()
    expect(
      await help.evaluate(
        (el) =>
          el.parentElement?.parentElement?.firstElementChild ===
          el.parentElement
      )
    ).toBe(true)
    await help.hover()
    await expect(panel).toBeVisible()
    await expect(help).toHaveAttribute('aria-expanded', 'true')
    await panel.hover()
    await expect(panel).toBeVisible()
    await page.locator('.brand').hover()
    await expect(panel).toBeHidden()
    await help.click()
    await page.locator('.brand').hover()
    await expect(panel).toBeVisible()
    const bounds = await panel.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height)
    await expect(panel).toContainText('site:example.com')
    await expect(panel).toContainText('br?wser')
    const examples = await panel.locator('dt code').allTextContents()
    expect(examples).toEqual(
      expect.arrayContaining([
        'brow*',
        '*script',
        'b*ser',
        'br?wser',
        'site:*.example.com',
        'site:example.com/docs',
        'inurl:github.com',
        'intitle:guide',
        'intext:brow*',
        'browser -"mobile browser"',
        'browser -mobil*',
        'browser -intext:mobile',
        'browser -url:/archive/',
        '"brow*"',
        '"br?wser"',
        'url:"/literal*"'
      ])
    )
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: `artifacts/search-syntax/evidence/search-help-${entry.replace(/[/.]/g, '-')}-${width}.png`
    })
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(help).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(panel).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(panel).toBeFocused()
    await panel.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    expect(
      await panel.evaluate(
        (el) => el.scrollHeight <= el.clientHeight || el.scrollTop > 0
      )
    ).toBe(true)
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await help.click()
    await page.locator('.brand').click()
    await expect(panel).toBeHidden()
    await help.click()
    await page.getByRole('button', { name: 'Close search help' }).click()
    await expect(panel).toBeHidden()
  }
})

test('help follows the selected Chinese language and reports no page errors', async () => {
  await page.evaluate(async () => {
    const { settings } = await chrome.runtime.sendMessage({
      command: 'settings'
    })
    await chrome.runtime.sendMessage({
      command: 'save-settings',
      settings: { ...settings, language: 'zh-CN' }
    })
  })
  const help = page.getByRole('button', { name: '搜索使用说明', exact: true })
  await help.click()
  const panel = page.getByRole('dialog', { name: '搜索使用说明' })
  await expect(panel).toContainText('精确短语')
  await expect(panel).toContainText('单词通配符')
  await expect(panel).toContainText('网址包含匹配')
  await page.screenshot({
    path: 'artifacts/search-syntax/evidence/search-help-zh-CN.png'
  })
  expect(errors).toEqual([])
})
