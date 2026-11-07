import { chromium, expect } from '@playwright/test'
import { mkdir, mkdtemp, writeFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const output = resolve('docs/webstore/screenshots')
const profile = await mkdtemp(join(tmpdir(), 'ftb-store-clean-'))
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const installedChrome = await access(chromePath).then(
  () => true,
  () => false
)
const context = await chromium.launchPersistentContext(profile, {
  ...(installedChrome ? { executablePath: chromePath } : { channel: 'chrome' }),
  headless: false,
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  locale: 'en-US',
  args: [
    '--enable-unsafe-extension-debugging',
    '--force-device-scale-factor=1'
  ],
  ignoreDefaultArgs: ['--disable-extensions']
})
context.setDefaultTimeout(12000)
async function navigate(page, url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
      return
    } catch (error) {
      if (attempt === 3) throw error
      console.log('Retrying public page', url)
    }
  }
}
const sources = [
  'https://en.wikipedia.org/wiki/Solar_System',
  'https://en.wikipedia.org/wiki/Planet',
  'https://en.wikipedia.org/wiki/Mars',
  'https://zh.wikipedia.org/wiki/太阳系',
  'https://zh.wikipedia.org/wiki/行星',
  'https://zh.wikipedia.org/wiki/火星'
]
try {
  const cdp = await context.browser().newBrowserCDPSession()
  const { id } = await cdp.send('Extensions.loadUnpacked', {
    path: resolve('build/chrome-mv3-prod')
  })
  const search = await context.newPage()
  await search.goto(`chrome-extension://${id}/tabs/search.html`)
  const settings = await context.newPage()
  await settings.goto(`chrome-extension://${id}/options.html`)
  let publicPages = []
  for (const locale of ['zh-CN', 'en']) {
    const zh = locale === 'zh-CN'
    // This is our disposable screenshot profile, never the user's daily browser.
    for (const page of publicPages) await page.close()
    publicPages = []
    await search.evaluate(() =>
      chrome.runtime.sendMessage({ command: 'clear' })
    )
    for (const url of sources.filter((url) =>
      url.includes(zh ? '//zh.' : '//en.')
    )) {
      const page = await context.newPage()
      await navigate(page, url)
      publicPages.push(page)
      console.log('Loaded', await page.title())
    }
    await expect
      .poll(
        async () =>
          (
            await search.evaluate(() =>
              chrome.runtime.sendMessage({ command: 'stats' })
            )
          ).pages,
        { timeout: 20000 }
      )
      .toBe(3)
    await mkdir(join(output, locale), { recursive: true })
    const capture = async (page, filename) => {
      await page.bringToFront()
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({
        path: join(output, locale, filename),
        type: 'jpeg',
        quality: 95,
        animations: 'disabled'
      })
      console.log('Captured', locale, filename)
    }
    await settings.locator('#search select').last().selectOption(locale)
    await settings
      .getByRole('button', {
        name: zh ? '保存设置' : 'Save settings',
        exact: true
      })
      .click()
    await expect(settings.getByRole('status')).toHaveText(
      zh ? '设置已保存' : 'Settings saved'
    )
    await search.reload()
    await search
      .getByRole('button', { name: zh ? '全部记录' : 'All pages', exact: true })
      .click()
    await search
      .locator('.search-box input')
      .fill(zh ? '"太阳系"' : '"solar system"')
    await expect(search.locator('.result-card').first()).toBeVisible()
    await expect(search.locator('.results')).toHaveAttribute(
      'aria-busy',
      'false'
    )
    await expect(search.locator('.result-title').first()).toHaveText(
      zh ? '太阳系' : 'Solar System'
    )
    await search.locator('.search-box input').blur()
    await capture(search, '01-fulltext-search.jpg')
    await search
      .locator('.result-card')
      .filter({
        has: search
          .locator('.result-title')
          .filter({ hasText: zh ? /^行星/ : /^Planet/ })
      })
      .getByRole('button', {
        name: zh ? '查看保存的文字' : 'Read saved text',
        exact: true
      })
      .first()
      .click()
    await expect(search.locator('.text-preview')).toBeVisible()
    await capture(search, '02-saved-text.jpg')
    await search
      .getByRole('button', { name: zh ? '关闭' : 'Close', exact: true })
      .click()
    await search
      .getByRole('button', {
        name: zh ? '打开的标签页' : 'Open tabs',
        exact: true
      })
      .click()
    await search
      .locator('.search-box input')
      .fill(zh ? '维基百科' : 'Wikipedia')
    await expect(
      search
        .getByRole('button', {
          name: zh ? '切换到标签页' : 'Switch to tab',
          exact: true
        })
        .first()
    ).toBeVisible()
    await expect(search.locator('.results')).toHaveAttribute(
      'aria-busy',
      'false'
    )
    await expect(search.locator('.result-title mark').first()).toBeVisible()
    await search.locator('.search-box input').blur()
    await capture(search, '04-open-tabs.jpg')
    await settings.reload()
    await settings.locator('#data').evaluate((element) => {
      window.scrollTo(0, element.getBoundingClientRect().top + scrollY - 36)
    })
    await capture(settings, '05-backup-settings.jpg')
    const engine = await context.newPage()
    await engine.goto(
      zh
        ? 'https://www.baidu.com/s?wd=' + encodeURIComponent('太阳系 维基百科')
        : 'https://www.bing.com/search?q=Solar+System+Wikipedia&setlang=en&cc=us',
      { waitUntil: 'domcontentloaded', timeout: 25000 }
    )
    await engine.locator('[data-ftb-companion]').waitFor({ timeout: 20000 })
    await engine
      .locator(zh ? '#content_left h3' : '#b_results .b_algo h2')
      .first()
      .waitFor()
    // Let the public results finish rendering, then keep the extension card in view.
    await engine.waitForTimeout(2500)
    await engine.locator('[data-ftb-companion]').evaluate((element) => {
      const top = element.getBoundingClientRect().top + scrollY
      if (top > 500) window.scrollTo(0, Math.max(0, top - 180))
    })
    await capture(engine, '03-search-engine.jpg')
    await engine.close()
  }
  await writeFile(
    join(output, 'sources.json'),
    JSON.stringify(
      {
        version: '2.0.0',
        width: 1280,
        height: 800,
        format: 'JPEG',
        isolatedProfile: true,
        accountsUsed: false,
        sources,
        searchEngines: ['https://www.baidu.com/', 'https://www.bing.com/']
      },
      null,
      2
    )
  )
} finally {
  await context.close()
}
