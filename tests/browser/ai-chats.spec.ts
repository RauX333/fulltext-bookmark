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
const sites = [
  {
    site: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app/',
    body: (word: string) => `
    <div class="conversation-container" id="turn-1">
      <user-query><user-query-content><div id="user-query-content-0"><span data-turn-id="s-turn-1"><div class="query-text" id="question"><h5 class="cdk-visually-hidden screen-reader-user-query-label">ReaderSecret</h5><p>${word}Question</p></div></span></div><div class="luminous-actions-container native-actions"><button>Copy</button></div></user-query-content></user-query>
      <model-response><message-content id="message-content-id-r-turn-1"><div class="markdown" aria-busy="true" id="answer">${word}Draft</div></message-content><message-actions><div class="buttons-container-v2 native-actions"><button>Like</button><button>Copy</button></div></message-actions></model-response>
    </div><input-container><div class="input-area-container"><input-area-v2 class="input-surface"><div><rich-textarea><div contenteditable="true">DraftSecret</div></rich-textarea></div><button>Send</button></input-area-v2></div></input-container>`
  },
  {
    site: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/a/chat/s/',
    body: (word: string) => `
    <div class="ds-virtual-list-visible-items">
      <div data-virtual-list-item-key="1"><div class="ds-message"><div class="ds-collapsible-text" id="question">${word}Question</div></div><div><div class="ds-flex native-actions"><div role="button">Copy</div><div role="button">Edit</div></div></div></div>
      <div data-virtual-list-item-key="2" aria-busy="true"><div class="ds-message"><div class="ds-markdown ds-assistant-message-main-content" id="answer">${word}Draft</div></div><div class="pending-actions"><div class="ds-flex native-actions"><div role="button">Copy</div><div role="button">Share</div></div></div></div>
    </div><div class="composer"><div class="input-surface"><div><div><textarea placeholder="给 DeepSeek 发送消息">DraftSecret</textarea></div><div><div role="button">Send</div></div></div></div></div>`
  }
]
async function patch(patch: Record<string, unknown>) {
  return extension.evaluate(
    (patch) => chrome.runtime.sendMessage({ command: 'save-settings', patch }),
    patch
  )
}
async function search(query: string) {
  return extension.evaluate(
    (query) =>
      chrome.runtime.sendMessage({
        command: 'search',
        request: { query, fuzzy: false }
      }),
    query
  )
}
async function fixture(site: (typeof sites)[number], id: string, word: string) {
  const page = await context.newPage()
  await page.route(new URL(site.url).origin + '/**', (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><meta charset="utf-8"><title>${site.name} fixture</title><style>
    body{font:16px sans-serif;margin:30px;max-width:800px}.native-actions{display:flex;align-items:center;gap:8px;opacity:0}user-query,model-response,input-container,input-area-v2,rich-textarea{display:block}user-query:hover .native-actions,model-response:hover .native-actions,[data-virtual-list-item-key]:hover .native-actions{opacity:1}.input-surface{display:block;border:1px solid #999;border-radius:24px;padding:16px;box-sizing:border-box}.composer,input-container{margin-top:30px}.cdk-visually-hidden{position:absolute;clip:rect(0,0,0,0);width:1px;height:1px;overflow:hidden}
    </style>${site.body(word)}<aside>SidebarSecret</aside>`
    })
  )
  await page.goto(site.url + id)
  return page
}
async function complete(page: Page, text: string) {
  await page.evaluate((text) => {
    document.querySelector('#answer')!.textContent = text
    document
      .querySelector('[aria-busy="true"]')
      ?.setAttribute('aria-busy', 'false')
  }, text)
}
test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(
    await mkdtemp(resolve(tmpdir(), 'ftb-ai-chats-')),
    {
      channel: 'chrome',
      headless: true,
      viewport: { width: 1280, height: 900 },
      args: ['--enable-unsafe-extension-debugging'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  const cdp = await context.browser()!.newBrowserCDPSession()
  extensionId = (
    await cdp.send('Extensions.loadUnpacked', {
      path: resolve('build/chrome-mv3-prod')
    })
  ).id
  extension = await context.newPage()
  await extension.goto(`chrome-extension://${extensionId}/tabs/search.html`)
  await patch({
    language: 'zh-CN',
    storeEveryPage: false,
    bookmarkAdaption: false
  })
})
test.afterAll(async () => {
  await context?.close()
})

for (const site of sites) {
  test(`${site.name}: auto-save waits for completion, groups bubbles and respects per-site switches`, async () => {
    const word = `${site.site}Cedar`
    const page = await fixture(site, 'automatic-test', word)
    const buttons = page.locator(`[data-ftb-${site.site}="message"]`)
    const whole = page.locator(`[data-ftb-${site.site}="conversation"]`)
    await expect(buttons).toHaveCount(2)
    await expect(whole).toHaveCount(1)
    await expect
      .poll(async () => (await search(word + 'Question')).total)
      .toBe(1)
    await page.waitForTimeout(4200)
    expect((await search(word + 'Draft')).total).toBe(0)
    // A token pause without aria-busy still must not save while response actions
    // have not appeared. Both real layouts mount their actions separately.
    const actionRow =
      site.site === 'gemini' ? 'message-actions' : '.pending-actions'
    const actions = await page
      .locator(actionRow)
      .evaluate((element) => element.outerHTML)
    await page.locator(actionRow).evaluate((element) => element.remove())
    await complete(page, word + 'StillStreaming')
    await page.waitForTimeout(4200)
    expect((await search(word + 'StillStreaming')).total).toBe(0)
    await page.evaluate(
      ({ site, actions }) => {
        const host =
          site === 'gemini'
            ? document.querySelector('model-response')
            : document.querySelector('[data-virtual-list-item-key="2"]')
        host!.insertAdjacentHTML('beforeend', actions)
      },
      { site: site.site, actions }
    )
    await complete(page, word + 'Final')
    await expect
      .poll(
        async () => (await search(word + 'Question ' + word + 'Final')).total
      )
      .toBe(1)
    await expect(whole).toHaveAttribute('data-save-state', 'saved')
    for (const secret of ['ReaderSecret', 'DraftSecret', 'SidebarSecret'])
      expect((await search(secret)).total).toBe(0)
    await extension.getByRole('searchbox').fill(word + 'Final')
    await extension.getByRole('button', { name: '查看保存的文字' }).click()
    await expect(extension.locator('.chat-message-user')).toContainText(
      word + 'Question'
    )
    await expect(extension.locator('.chat-message-assistant')).toContainText(
      site.name
    )
    await expect(extension.locator('.chat-message-assistant')).toContainText(
      word + 'Final'
    )
    await extension.getByRole('button', { name: '关闭', exact: true }).click()
    const options = await context.newPage()
    await options.goto(`chrome-extension://${extensionId}/options.html`)
    await options
      .getByLabel(`启用 ${site.name} 对话保存`, { exact: false })
      .uncheck()
    await expect(page.locator(`[data-ftb-${site.site}]`)).toHaveCount(0)
    await expect(
      options.getByLabel(`自动保存 ${site.name} 对话`, { exact: false })
    ).toBeDisabled()
    await complete(page, word + 'Disabled')
    await page.waitForTimeout(4200)
    expect((await search(word + 'Disabled')).total).toBe(0)
    await options
      .getByLabel(`启用 ${site.name} 对话保存`, { exact: false })
      .check()
    await expect
      .poll(async () => (await search(word + 'Disabled')).total)
      .toBe(1)
    await options.close()
    await page.close()
  })

  test(`${site.name}: native toolbar, outside composer, manual save state, reload, edits and route changes`, async () => {
    await patch({ [`${site.site}AutoCapture`]: false })
    const word = `${site.site}Willow`
    const page = await fixture(site, 'manual-test', word)
    await complete(page, word + 'Final')
    const buttons = page.locator(`[data-ftb-${site.site}="message"]`)
    const whole = page.locator(`[data-ftb-${site.site}="conversation"]`)
    await expect(buttons).toHaveCount(2)
    await expect(buttons.first().locator('..')).toHaveCSS('opacity', '0')
    await page.locator('#question').hover()
    await expect(buttons.first().locator('..')).toHaveCSS('opacity', '1')
    const surface = await page.locator('.input-surface').boundingBox()
    const box = await whole.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(surface!.x + surface!.width)
    await expect(whole).toHaveAttribute('data-save-state', 'unsaved')
    await buttons.first().click()
    await expect(buttons.first()).toHaveAttribute('data-save-state', 'saved')
    expect((await search(word + 'Final')).total).toBe(0)
    await whole.click()
    await expect(whole).toHaveAttribute('data-save-state', 'saved')
    await page.reload()
    await complete(page, word + 'Final')
    await expect(whole).toHaveAttribute('data-save-state', 'saved')
    await complete(page, word + 'Edited')
    await expect(buttons.last()).toHaveAttribute('data-save-state', 'unsaved')
    await expect(whole).toHaveAttribute('data-save-state', 'unsaved')
    await buttons.last().click()
    await expect.poll(async () => (await search(word + 'Edited')).total).toBe(1)
    expect((await search(word + 'Final')).total).toBe(0)
    // Moving/remounting an item in a virtual list keeps its identity and order.
    await page.evaluate(() => {
      const parent = document
        .querySelector('#question')!
        .closest('[data-virtual-list-item-key], .conversation-container')!
      parent.replaceWith(parent.cloneNode(true))
    })
    await expect(buttons).toHaveCount(2)
    await expect(buttons.first()).toHaveAttribute('data-save-state', 'saved')
    await page.screenshot({
      path: `test-results/${site.site}-save-buttons.png`
    })
    await page.evaluate((url) => {
      history.pushState({}, '', url)
      document.querySelector('#question')!.textContent = 'DifferentChat'
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, site.url + 'other-test')
    await expect(whole).toHaveAttribute('data-save-state', 'unsaved')
    await patch({ forbiddenURLs: [site.url + 'other-test'] })
    await expect(buttons).toHaveCount(0)
    await patch({ forbiddenURLs: [] })
    await page.close()
  })
}
