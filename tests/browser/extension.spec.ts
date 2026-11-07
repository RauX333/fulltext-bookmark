import {
  test,
  expect,
  chromium,
  type BrowserContext,
  type Page
} from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { resolve } from 'node:path'
import { mkdtemp, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
let context: BrowserContext,
  extension: Page,
  extensionId: string,
  origin: string,
  server: Server
const errors: string[] = []
test.describe.configure({ mode: 'serial' })
async function search(query: string, request: Record<string, unknown> = {}) {
  return extension.evaluate(
    async ({ query, request }) =>
      chrome.runtime.sendMessage({
        command: 'search',
        request: { query, ...request }
      }),
    { query, request }
  )
}
test.beforeAll(async () => {
  server = createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    if (req.url === '/frame')
      return res.end('<p>同源框架独特文字 FrameNebula</p>')
    res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Browser capture fixture</title><style>.hidden{display:none}.mobile{display:none}@media(max-width:500px){.desktop{display:none}.mobile{display:block}}</style></head><body>
      <nav>Navigation</nav><main><h1>网页全文保存测试</h1><p>初始正文：浏览器中的中文全文搜索，English browser history.</p><p class="desktop">DesktopVisible</p><p class="mobile">MobileVisible</p><div class="hidden"><article>HiddenResponsiveSecret</article></div><input value="PrivateInputSecret"><textarea>PrivateTextareaSecret</textarea><div contenteditable="true">PrivateEditableSecret</div><script>const secret = 'PrivateScriptSecret'</script><div id="comments"></div><div id="host"></div><iframe src="/frame"></iframe><button id="more">Load comments</button><button id="route">Change route</button></main>
      <script>document.querySelector('#host').attachShadow({mode:'open'}).innerHTML='<p>ShadowOrchid 可搜索影子内容</p>';document.querySelector('#more').onclick=()=>document.querySelector('#comments').innerHTML='<p>异步加载评论 DynamicMagnolia</p>';document.querySelector('#route').onclick=()=>{history.pushState({},'','/spa-route');document.title='第二个路由';document.body.innerHTML='<main><p>独立路由 RouteCedar</p></main>'}</script></body></html>`)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  context = await chromium.launchPersistentContext(
    await mkdtemp(resolve(tmpdir(), 'ftb-chrome-')),
    {
      channel: 'chrome',
      headless: !process.env.HEADED,
      viewport: { width: 1280, height: 900 },
      args: ['--enable-unsafe-extension-debugging', '--lang=zh-CN'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  const cdp = await context.browser()!.newBrowserCDPSession()
  const loaded = await cdp.send('Extensions.loadUnpacked', {
    path: resolve('build/chrome-mv3-prod')
  })
  extensionId = loaded.id
  context.on('page', (page) =>
    page.on('pageerror', (error) => errors.push(error.message))
  )
  extension = await context.newPage()
  await extension.goto(`chrome-extension://${extensionId}/tabs/search.html`)
  await expect(extension.locator('.search-box input')).toBeVisible()
  await mkdir('test-results/evidence', { recursive: true })
})
test.afterAll(async () => {
  await context?.close()
  await new Promise<void>((resolve) => server?.close(() => resolve()))
})

test('saves visible, same-origin frame and shadow DOM text; excludes hidden and input text', async () => {
  const page = await context.newPage()
  await page.goto(origin + '/capture')
  await expect.poll(async () => (await search('初始正文')).total).toBe(1)
  for (const query of ['FrameNebula', 'ShadowOrchid', 'DesktopVisible'])
    await expect.poll(async () => (await search(query)).total).toBe(1)
  for (const query of [
    'HiddenResponsiveSecret',
    'PrivateInputSecret',
    'PrivateTextareaSecret',
    'PrivateEditableSecret',
    'PrivateScriptSecret',
    'MobileVisible'
  ])
    expect((await search(query)).total, query).toBe(0)
  await page.getByText('Load comments').click()
  await expect.poll(async () => (await search('DynamicMagnolia')).total).toBe(1)
  await page.evaluate(() => {
    document.querySelector('#comments')!.innerHTML =
      '<p>VirtualWillow 下一批滚动内容</p>'
  })
  await expect.poll(async () => (await search('VirtualWillow')).total).toBe(1)
  expect((await search('DynamicMagnolia')).total).toBe(1)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(async () => (await search('MobileVisible')).total).toBe(1)
  await page.getByText('Change route').click()
  await expect
    .poll(async () => (await search('RouteCedar')).results[0]?.url)
    .toBe(origin + '/spa-route')
  expect((await search('DynamicMagnolia')).results[0]?.url).toBe(
    origin + '/capture'
  )
  await page.goto(origin + '/capture')
  await page.evaluate(() =>
    document
      .querySelector('main')!
      .append(document.createTextNode(' RevisitCedar'))
  )
  await expect.poll(async () => (await search('RevisitCedar')).total).toBe(1)
  expect((await search('DynamicMagnolia')).total).toBe(1)

  await page.close()
})
test('search UI handles IME completion, empty state, snippets and open tabs', async () => {
  await extension.reload()
  const input = extension.locator('.search-box input')
  await input.fill('初始正文')
  await input.dispatchEvent('compositionstart')
  await input.fill('异步加载评论')
  await input.dispatchEvent('compositionend')
  await expect(extension.locator('.result-card')).toHaveCount(1)
  await expect(extension.locator('.snippet')).toContainText('异步加载评论')
  await expect(extension.locator('mark').first()).toBeVisible()
  await input.fill('thisdoesnotexist')
  await expect(extension.locator('.empty')).toBeVisible()
  await expect(extension.locator('.result-card')).toHaveCount(0)
  await input.fill('')
  await expect(extension.locator('.result-card').first()).toBeVisible()
  const tab = await context.newPage()
  await tab.goto(origin + '/open-tab')
  await extension
    .getByRole('button', { name: /打开的标签页|Open tabs/ })
    .click()
  await input.fill('Browser capture')
  await expect(extension.locator('.result-card')).toHaveCount(1)
  await extension
    .getByRole('button', { name: /切换到标签页|Switch to tab/ })
    .click()
  const active = await extension.evaluate(() =>
    chrome.tabs.query({ active: true, currentWindow: true })
  )
  expect(active[0].url).toBe(origin + '/open-tab')
  await tab.close()
})
test('popup and settings fit 360px, 390px, 768px and desktop widths; settings persist', async () => {
  const settings = await context.newPage()
  await settings.goto(`chrome-extension://${extensionId}/options.html`)
  await expect(settings.locator('#capture')).toBeVisible()
  const retention = settings.locator('input[type=number]').first()
  await retention.fill('0')
  await settings.getByRole('button', { name: /保存设置|Save settings/ }).click()
  await expect(settings.getByRole('status')).toContainText(
    /设置已保存|Settings saved/
  )
  await settings.reload()
  await expect(retention).toHaveValue('0')
  for (const width of [360, 390, 768, 1280]) {
    await settings.setViewportSize({ width, height: 900 })
    expect(
      await settings.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      `settings ${width}`
    ).toBe(true)
    await settings.screenshot({
      path: `test-results/evidence/settings-${width}.png`,
      fullPage: true
    })
  }
  const popup = await context.newPage()
  await popup.goto(`chrome-extension://${extensionId}/popup.html`)
  for (const width of [360, 400]) {
    await popup.setViewportSize({ width, height: 600 })
    await expect(popup.locator('.search-box input')).toBeVisible()
    expect(
      await popup.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      `popup ${width}`
    ).toBe(true)
    expect(
      await popup
        .locator('.search-footer')
        .evaluate((e) => e.getBoundingClientRect().bottom <= innerHeight),
      `popup footer ${width}`
    ).toBe(true)
    await popup.screenshot({ path: `test-results/evidence/popup-${width}.png` })
  }
  await popup
    .getByRole('button', { name: /在标签页中搜索|Search in a tab/ })
    .click()
  await expect
    .poll(
      () =>
        context.pages().filter((p) => p.url().includes('/tabs/search.html'))
          .length
    )
    .toBeGreaterThan(1)
  await popup.close()
  await settings.close()
})
test('worker suspension preserves storage and search readiness', async () => {
  const session = await context.newCDPSession(extension)
  await session.send('ServiceWorker.enable')
  await session.send('ServiceWorker.stopAllWorkers')
  await expect.poll(async () => (await search('DynamicMagnolia')).total).toBe(1)
})
test('Weibo card adapter re-reads expanded and recycled posts; local save only', async () => {
  const page = await context.newPage()
  await page.route('https://weibo.com/fixture', (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: '<article><a class="_time_abc_33" href="https://weibo.com/1234567890/AbCdE1234">Today</a><a class="_name_abc_120">测试作者</a><div class="wbpro-feed-content"><div class="detail_wbtext">WeiboInitial 桃花</div></div><div class="retweet"><div class="wbpro-feed-reText">RetweetedBirch 原微博转发正文</div></div><footer></footer></article>'
    })
  )
  await page.goto('https://weibo.com/fixture')
  const button = page.locator('[data-ftb-weibo]')
  await expect(button).toHaveCount(1)
  await expect(button.locator('img')).toHaveAttribute(
    'alt',
    'Fulltext Bookmark'
  )
  const originalIcon =
    'data:image/png;base64,' +
    (
      await (await import('node:fs/promises')).readFile('assets/icon512.png')
    ).toString('base64')
  expect(
    await button.locator('img').evaluate(async (img, original) => {
      const reference = new Image()
      reference.src = original
      await reference.decode()
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 512
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img as HTMLImageElement, 0, 0)
      const actual = canvas.toDataURL()
      ctx.clearRect(0, 0, 512, 512)
      ctx.drawImage(reference, 0, 0)
      return actual === canvas.toDataURL()
    }, originalIcon)
  ).toBe(true)
  await expect
    .poll(() =>
      button
        .locator('img')
        .evaluate((img) => (img as HTMLImageElement).naturalWidth)
    )
    .toBe(512)
  await page.evaluate(() => {
    document.querySelector('.detail_wbtext')!.textContent +=
      ' WeiboExpanded 长文展开后的文字'
  })
  await button.click()
  await expect
    .poll(
      async () => (await search('WeiboExpanded', { source: 'bookmarks' })).total
    )
    .toBe(1)
  expect(
    (await search('RetweetedBirch', { source: 'bookmarks' })).results[0].title
  ).toContain('@测试作者')
  await page.evaluate(() => {
    document.querySelector('a')!.href = 'https://weibo.com/1234567890/ZyXwV6789'
    document.querySelector('.detail_wbtext')!.textContent =
      'WeiboRecycled 下一条微博'
  })
  await expect(button).toHaveAttribute(
    'data-url',
    'https://weibo.com/1234567890/ZyXwV6789'
  )
  await button.click()
  await expect
    .poll(
      async () =>
        (await search('WeiboRecycled', { source: 'bookmarks' })).results[0]?.url
    )
    .toBe('https://weibo.com/1234567890/ZyXwV6789')
  await page.close()
})
test('all screens switch between English and Chinese and retain omnibox settings', async () => {
  const settings = await context.newPage()
  await settings.goto(`chrome-extension://${extensionId}/options.html`)
  const language = settings.locator('#search select').last()
  for (const locale of ['en', 'zh-CN']) {
    await language.selectOption(locale)
    await settings
      .getByRole('button', {
        name: locale === 'en' ? 'Save settings' : '保存设置',
        exact: true
      })
      .click()
    await expect(settings.getByRole('status')).toContainText(
      locale === 'en' ? 'Settings saved' : '设置已保存'
    )
    await extension.reload()
    await expect(extension.locator('.search-box input')).toHaveAttribute(
      'placeholder',
      locale === 'en' ? 'Search text' : '搜索文字'
    )
    await expect(
      settings.getByRole('button', {
        name: locale === 'en' ? 'Test connection' : '测试连接',
        exact: true
      })
    ).toBeVisible()
    await expect(
      settings.getByLabel(
        locale === 'en'
          ? 'Address bar search (kw + Tab)'
          : '地址栏搜索（kw + Tab）',
        { exact: false }
      )
    ).toBeChecked()
    expect(await settings.locator('body').innerText()).not.toMatch(
      /GPT|OpenAI|内容保存在本机/
    )
  }
  await settings.close()
})

test('page errors are absent', () => {
  expect(errors).toEqual([])
})
