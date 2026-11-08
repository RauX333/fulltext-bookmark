import {
  test,
  expect,
  chromium,
  type BrowserContext,
  type Page
} from '@playwright/test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

let context: BrowserContext, extension: Page, extensionId: string
test.describe.configure({ mode: 'serial' })

async function search(query: string, source = 'all') {
  return extension.evaluate(
    ({ query, source }) =>
      chrome.runtime.sendMessage({
        command: 'search',
        request: { query, source, fuzzy: false }
      }),
    { query, source }
  )
}

async function patchSettings(patch: Record<string, unknown>) {
  return extension.evaluate(async (patch) => {
    const { settings } = await chrome.runtime.sendMessage({
      command: 'settings'
    })
    return chrome.runtime.sendMessage({
      command: 'save-settings',
      settings: { ...settings, ...patch }
    })
  }, patch)
}

async function captureNow(page: Page) {
  await extension.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url })
    await chrome.tabs.sendMessage(tab.id!, { command: 'capture-now' })
  }, page.url())
}

async function fixture(url: string, body: string) {
  const page = await context.newPage()
  await page.route(url, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><meta charset="utf-8"><title>Social capture fixture</title>${body}`
    })
  )
  await page.goto(url)
  return page
}

const tweet = (word: string, status = '123456789', host = 'x.com') => `
  <article data-testid="tweet" role="article" id="main-post" onclick="document.body.dataset.cardClicked='true'">
    <div role="link" data-testid="quoteTweet">
      <div data-testid="User-Name"><a role="link" href="https://x.com/quoted">Quoted Author</a></div>
      <a role="link" href="https://x.com/quoted/status/999999999"><time>Quoted time</time></a>
      <div data-testid="tweetText">QuotedWillow 引用内容</div>
      <div role="group"><button>Quote action</button></div>
    </div>
    <div data-testid="User-Name"><a role="link" href="https://${host}/Example_User">示例作者</a><a role="link" href="https://${host}/Example_User">@Example_User</a><a role="link" id="post-time" href="https://${host}/Example_User/status/${status}?s=20"><time>Today</time></a></div>
    <div data-testid="tweetText" id="post-text">${word} <a role="link" href="https://x.com/someone/status/222222222">embedded link</a></div>
    <div hidden><div data-testid="tweetText">HiddenQuoteSecret</div></div>
    <div role="group" id="post-actions"><button onclick="document.body.dataset.nativeClicked='true'">Like</button><button>Bookmark</button></div>
  </article>`

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(
    await mkdtemp(resolve(tmpdir(), 'ftb-social-')),
    {
      channel: 'chrome',
      headless: true,
      viewport: { width: 1280, height: 900 },
      args: ['--enable-unsafe-extension-debugging'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  const cdp = await context.browser()!.newBrowserCDPSession()
  const loaded = await cdp.send('Extensions.loadUnpacked', {
    path: resolve('build/chrome-mv3-prod')
  })
  extensionId = loaded.id
  extension = await context.newPage()
  await extension.goto(`chrome-extension://${extensionId}/tabs/search.html`)
  await patchSettings({ language: 'zh-CN' })
})

test.afterAll(async () => {
  await context?.close()
})

test('settings save without a button, validate drafts with visible alerts, and preserve other changes', async () => {
  const settings = await context.newPage()
  await settings.goto(`chrome-extension://${extensionId}/options.html`)
  await expect(
    settings.getByRole('button', { name: '保存设置', exact: true })
  ).toHaveCount(0)
  const retention = settings.getByLabel('保留天数', { exact: true })
  await retention.fill('12')
  await expect(settings.getByTestId('settings-save-status')).toHaveText(
    '设置已自动保存'
  )
  await retention.fill('-1')
  await expect(settings.getByRole('alert')).toContainText('0–36500')
  await expect(retention).toHaveAttribute('aria-invalid', 'true')
  const read = () =>
    extension.evaluate(
      async () =>
        (await chrome.runtime.sendMessage({ command: 'settings' })).settings
    )
  expect((await read()).tempPageExpireTime).toBe(12 * 86400000)
  // Invalid text must not prevent a separate switch from taking effect.
  await settings.getByLabel('启用微博帖子保存', { exact: false }).uncheck()
  await expect.poll(async () => (await read()).weiboSupport).toBe(false)
  expect((await read()).tempPageExpireTime).toBe(12 * 86400000)
  await retention.fill('0')
  await settings.getByLabel('启用微博帖子保存', { exact: false }).check()
  await expect.poll(async () => (await read()).tempPageExpireTime).toBe(0)
  const results = settings.getByLabel('每页结果数量', { exact: false })
  await results.fill('3')
  await expect(settings.getByRole('alert')).toContainText('5–100')
  expect((await read()).maxResults).toBe(30)
  await results.fill('25')
  const exclusions = settings.getByLabel('不保存的网址', { exact: false })
  await exclusions.fill('https://example.com/*\n/[broken/')
  await expect(settings.getByRole('alert')).toContainText('第 2 行')
  expect((await read()).forbiddenURLs).not.toContain('/[broken/')
  await exclusions.fill('https://private.example/*\n/secret/')
  await exclusions.blur()
  await expect
    .poll(async () => (await read()).forbiddenURLs)
    .toEqual(['https://private.example/*', '/secret/'])
  const api = settings.getByLabel('API 地址', { exact: false })
  await api.fill('javascript:bad')
  await expect(settings.getByRole('alert')).toContainText('HTTP(S)')
  expect((await read()).remoteStoreURL).toBe('')
  await api.fill('https://example.com/api')
  await expect
    .poll(async () => (await read()).remoteStoreURL)
    .toBe('https://example.com/api')
  await settings.reload()
  await expect(results).toHaveValue('25')
  await expect(retention).toHaveValue('0')
  await expect(api).toHaveValue('https://example.com/api')
  await settings.close()
  await patchSettings({ forbiddenURLs: [], remoteStoreURL: '', maxResults: 30 })
})

test('worker serializes setting patches and rejects invalid values without changing stored settings', async () => {
  const responses = await extension.evaluate(async () =>
    Promise.all([
      chrome.runtime.sendMessage({
        command: 'save-settings',
        patch: { maxResults: 45 }
      }),
      chrome.runtime.sendMessage({
        command: 'save-settings',
        patch: { twitterSupport: false }
      }),
      chrome.runtime.sendMessage({
        command: 'save-settings',
        patch: { maxResults: 2 }
      }),
      chrome.runtime.sendMessage({
        command: 'save-settings',
        patch: { twitterSupport: true }
      })
    ])
  )
  expect(responses.map((r) => r.ok)).toEqual([true, true, false, true])
  const { settings } = await extension.evaluate(() =>
    chrome.runtime.sendMessage({ command: 'settings' })
  )
  expect(settings.maxResults).toBe(45)
  expect(settings.twitterSupport).toBe(true)
  await patchSettings({ maxResults: 30 })
})

test('Weibo search cards save the outer author and visible expanded text under the timestamp permalink', async () => {
  const page = await fixture(
    'https://s.weibo.com/weibo?q=fixture',
    `<div class="card-wrap" action-type="feed_list_item" mid="123456789"><div class="card"><div class="info"><a class="name" href="https://weibo.com/1234567890">搜索作者</a></div><p class="from"><a href="https://weibo.com/1234567890/Search123?refer_flag=search">Today</a></p><p class="txt" node-type="feed_list_content">SearchSpruce 短文</p><p class="txt" node-type="feed_list_content_full" hidden>SearchSpruce 完整长文 ExpandedSycamore</p><div class="card-act"><button>Like</button></div></div></div>`
  )
  const button = page.locator('[data-ftb-weibo]')
  await expect(button).toHaveCount(1)
  await button.click()
  await expect
    .poll(async () => (await search('SearchSpruce', 'bookmarks')).total)
    .toBe(1)
  expect((await search('SearchSpruce')).results[0].title).toContain('@搜索作者')
  expect((await search('ExpandedSycamore')).total).toBe(0)
  await page.evaluate(() => {
    document.querySelector<HTMLElement>(
      '[node-type="feed_list_content"]'
    )!.hidden = true
    document.querySelector<HTMLElement>(
      '[node-type="feed_list_content_full"]'
    )!.hidden = false
  })
  await button.click()
  await expect
    .poll(
      async () =>
        (await search('ExpandedSycamore', 'bookmarks')).results[0]?.url
    )
    .toBe('https://weibo.com/1234567890/Search123')
  await page.close()
})

test('X defaults to manual saving, captures quotes, and re-reads expanded and recycled posts', async () => {
  const page = await fixture(
    'https://x.com/home',
    tweet('ManualCedar 帖子正文') +
      '<article data-testid="tweet" role="article"><div data-testid="tweetText">OtherFir 另一条帖子</div><a role="link" href="/second/status/777777777"><time>Now</time></a></article><article data-testid="tweet" role="article"><div role="link"><a role="link" href="/quoteonly/status/555555555"><time>Quoted only</time></a></div></article>'
  )
  const button = page.locator('#main-post [data-ftb-twitter]')
  await expect(page.locator('[data-ftb-twitter]')).toHaveCount(2)
  await expect(button).toHaveText('保存帖子')
  await expect(page.locator('#post-actions [data-ftb-twitter]')).toHaveCount(1)
  await expect(button).toHaveAttribute(
    'data-url',
    'https://x.com/example_user/status/123456789'
  )
  // Exercise the bookmark-triggered path as well as the normal scheduled pass.
  await captureNow(page)
  await page.waitForTimeout(2800)
  expect((await search('ManualCedar')).total).toBe(0)
  await button.click()
  await expect(button).toHaveText('已保存 · 再次更新')
  const saved = await search('ManualCedar', 'bookmarks')
  expect(saved.total).toBe(1)
  expect(saved.results[0].url).toBe(
    'https://x.com/example_user/status/123456789'
  )
  expect(saved.results[0].title).toContain('示例作者 @example_user')
  expect((await search('QuotedWillow', 'bookmarks')).total).toBe(1)
  expect((await search('HiddenQuoteSecret')).total).toBe(0)
  expect((await search('OtherFir')).total).toBe(0)
  expect(
    await page.locator('body').getAttribute('data-card-clicked')
  ).toBeNull()
  expect(
    await page.locator('body').getAttribute('data-native-clicked')
  ).toBeNull()
  await page.evaluate(() => {
    document.querySelector('#post-text')!.textContent += ' ExpandedOak 展开全文'
  })
  await button.click()
  await expect
    .poll(async () => (await search('ExpandedOak', 'bookmarks')).total)
    .toBe(1)
  expect((await search('ExpandedOak', 'bookmarks')).results[0].id).toBe(
    saved.results[0].id
  )
  // An href-only change is enough to reset a recycled card's button.
  await page
    .locator('#post-time')
    .evaluate((link) =>
      link.setAttribute('href', 'https://x.com/NextAuthor/status/987654321')
    )
  await expect(button).toHaveText('保存帖子')
  await expect(button).toHaveAttribute(
    'data-url',
    'https://x.com/nextauthor/status/987654321'
  )
  await page.evaluate(() => {
    document.querySelector('#post-text')!.textContent = 'RecycledBirch 新帖子'
  })
  await button.click()
  await expect
    .poll(
      async () => (await search('RecycledBirch', 'bookmarks')).results[0]?.url
    )
    .toBe('https://x.com/nextauthor/status/987654321')
  expect((await search('ManualCedar', 'bookmarks')).results[0].url).toBe(
    'https://x.com/example_user/status/123456789'
  )
  await page.close()
})

test('twitter.com aliases update the same post with global automatic saving off', async () => {
  await patchSettings({ storeEveryPage: false, bookmarkAdaption: false })
  const page = await fixture(
    'https://mobile.twitter.com/home',
    tweet('AliasMagnolia', '123456789', 'mobile.twitter.com')
  )
  const button = page.locator('[data-ftb-twitter]')
  await expect(button).toHaveCount(1)
  await button.click()
  await expect
    .poll(async () => (await search('AliasMagnolia', 'bookmarks')).total)
    .toBe(1)
  expect((await search('AliasMagnolia')).results[0].id).toBe(
    (await search('ManualCedar')).results[0].id
  )
  await patchSettings({
    forbiddenURLs: ['https://x.com/example_user/status/*']
  })
  await page.evaluate(() => {
    document.querySelector('#post-text')!.textContent = 'ExcludedMaple'
  })
  await button.click()
  await expect(button).toHaveText('重试保存')
  expect((await search('ExcludedMaple')).total).toBe(0)
  await page.close()
  await patchSettings({
    storeEveryPage: true,
    bookmarkAdaption: true,
    forbiddenURLs: []
  })
})

test('Weibo and X switches apply independently to open pages and block forced capture when disabled', async () => {
  const x = await fixture(
    'https://x.com/settings-fixture',
    tweet('SwitchCypress')
  )
  const weibo = await fixture(
    'https://weibo.com/settings-fixture',
    '<article><a class="time" href="https://weibo.com/1234567890/AbCdE1234">Today</a><a class="_name_abc">微博作者</a><div class="weibo-text">WeiboManualPine</div><footer></footer></article>'
  )
  await expect(x.locator('[data-ftb-twitter]')).toHaveCount(1)
  await expect(weibo.locator('[data-ftb-weibo]')).toHaveText('保存帖子')
  await captureNow(weibo)
  expect((await search('WeiboManualPine')).total).toBe(0)
  await weibo.locator('[data-ftb-weibo]').click()
  await expect
    .poll(async () => (await search('WeiboManualPine', 'bookmarks')).total)
    .toBe(1)
  await patchSettings({ twitterAutoCapture: true })
  await expect
    .poll(async () =>
      (await search('SwitchCypress')).results.some(
        (r: any) => r.url === 'https://x.com/settings-fixture'
      )
    )
    .toBe(true)
  await weibo.evaluate(() => {
    document.querySelector('.weibo-text')!.textContent = 'WeiboUnclickedLarch'
  })
  await captureNow(weibo)
  expect((await search('WeiboUnclickedLarch')).total).toBe(0)
  await patchSettings({ weiboAutoCapture: true })
  await expect
    .poll(async () => (await search('WeiboUnclickedLarch')).results[0]?.url)
    .toBe('https://weibo.com/settings-fixture')
  const settings = await context.newPage()
  await settings.goto(`chrome-extension://${extensionId}/options.html`)
  await settings.getByLabel('启用微博帖子保存', { exact: false }).uncheck()
  await settings
    .getByLabel('启用 X（Twitter）帖子保存', { exact: false })
    .uncheck()
  await expect(
    settings.getByLabel('自动保存微博页面文字', { exact: false })
  ).toBeDisabled()
  await expect(
    settings.getByLabel('自动保存 X 页面文字', { exact: false })
  ).toBeDisabled()
  await expect(settings.getByTestId('settings-save-status')).toHaveText(
    '设置已自动保存'
  )
  await expect(x.locator('[data-ftb-twitter]')).toHaveCount(0)
  await expect(weibo.locator('[data-ftb-weibo]')).toHaveCount(0)
  await x.evaluate(() => {
    document.querySelector('#post-text')!.textContent = 'DisabledSequoia'
  })
  await weibo.evaluate(() => {
    document.querySelector('.weibo-text')!.textContent = 'DisabledLinden'
  })
  await captureNow(x)
  await captureNow(weibo)
  expect((await search('DisabledSequoia')).total).toBe(0)
  expect((await search('DisabledLinden')).total).toBe(0)
  expect((await search('WeiboManualPine', 'bookmarks')).total).toBe(1)
  await patchSettings({ twitterSupport: true, twitterAutoCapture: false })
  await expect(x.locator('[data-ftb-twitter]')).toHaveCount(1)
  await expect(weibo.locator('[data-ftb-weibo]')).toHaveCount(0)
  await captureNow(x)
  expect((await search('DisabledSequoia')).total).toBe(0)
  await patchSettings({ forbiddenURLs: ['https://x.com/settings-fixture'] })
  await expect(x.locator('[data-ftb-twitter]')).toHaveCount(0)
  await settings.close()
  await x.close()
  await weibo.close()
})
