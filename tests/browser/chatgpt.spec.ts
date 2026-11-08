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
const modern = (word: string, state = 'complete') => `
<main><div data-talvt-turn-state="${state}" id="turn">
<div data-chatgpt-search-unit-key="fallback-turn-0:0:user" data-chatgpt-search-message-ids="user-1"><div data-user-message-bubble="true" id="user">${word}Question</div><div class="turn-action-controls"><button>Copy</button><button>Share</button></div></div>
<div data-chatgpt-search-unit-key="fallback-turn-0:1:assistant" data-chatgpt-search-message-ids="assistant-1"><div data-chatgpt-selection-message-id="assistant-1"><div data-markdown-text-style="assistant-message" id="answer"><p>${word}Answer</p><pre>const example = 42;</pre></div></div><div class="turn-action-controls"><button>Copy</button><button>Share</button></div></div>
</div></main>
<aside>SidebarSecret</aside><div hidden data-user-message-bubble="true">HiddenSecret</div>
<form onsubmit="event.preventDefault();document.body.dataset.submitted='yes'"><div data-composer-body><div data-composer-markdown contenteditable="true">DraftSecret</div><div data-composer-trailing-controls><div class="contents"><div><button type="submit">Send</button></div></div></div></div></form>`
async function fixture(id: string, body: string) {
  const page = await context.newPage()
  await page.route('https://chatgpt.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><meta charset="utf-8"><title>${id} - ChatGPT</title><style>body{font:16px sans-serif;margin:30px}main{max-width:800px}form{margin-top:20px;width:800px;box-sizing:border-box}[data-composer-body]{display:flex;justify-content:space-between;padding:10px;border:1px solid #aaa;border-radius:24px}.turn-action-controls{display:flex;align-items:center;opacity:0}[data-chatgpt-search-message-ids]:hover .turn-action-controls,[data-chatgpt-search-message-ids]:focus-within .turn-action-controls,article:hover .turn-action-controls{opacity:1}[data-user-message-bubble]{background:#eee;padding:12px}button{cursor:pointer}</style>${body}`
    })
  )
  await page.goto(`https://chatgpt.com/c/${id}`)
  return page
}
test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(
    await mkdtemp(resolve(tmpdir(), 'ftb-chat-')),
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

test('automatic saving waits through streaming pauses and groups completed messages into bubble preview', async () => {
  const page = await fixture(
    'stream-test',
    modern('StreamingCedar', 'streaming') +
      '<button data-testid="stop-button">Stop</button>'
  )
  await expect(page.locator('[data-ftb-chatgpt="message"]')).toHaveCount(2)
  await expect(
    page.locator('form > [data-ftb-chatgpt="conversation"]')
  ).toHaveCount(1)
  await expect
    .poll(async () => (await search('StreamingCedarQuestion')).total)
    .toBe(1)
  await page.waitForTimeout(4200)
  expect((await search('StreamingCedarAnswer')).total).toBe(0)
  await page.evaluate(() => {
    document.querySelector('#answer p')!.textContent = 'FinalWillowAnswer'
    document
      .querySelector('#turn')!
      .setAttribute('data-talvt-turn-state', 'complete')
    document.querySelector('[data-testid="stop-button"]')!.remove()
  })
  await expect
    .poll(async () => (await search('FinalWillowAnswer')).total)
    .toBe(1)
  expect((await search('StreamingCedarQuestion FinalWillowAnswer')).total).toBe(
    1
  )
  for (const secret of ['DraftSecret', 'SidebarSecret', 'HiddenSecret'])
    expect((await search(secret)).total).toBe(0)
  await extension.getByRole('searchbox').fill('FinalWillowAnswer')
  await extension.getByRole('button', { name: '查看保存的文字' }).click()
  await expect(extension.locator('.chat-message-user')).toContainText(
    'StreamingCedarQuestion'
  )
  await expect(extension.locator('.chat-message-assistant')).toContainText(
    'FinalWillowAnswer'
  )
  await expect(extension.locator('.chat-message-assistant')).toContainText(
    'const example = 42;'
  )
  await extension.screenshot({
    path: 'test-results/chatgpt-conversation-preview.png'
  })
  await extension.setViewportSize({ width: 390, height: 844 })
  await expect(extension.locator('.chat-message-assistant')).toBeVisible()
  expect(
    await extension
      .locator('[role="dialog"]')
      .evaluate((element) => element.scrollWidth <= element.clientWidth)
  ).toBe(true)
  await extension.screenshot({ path: 'test-results/chatgpt-preview-390.png' })
  await extension.setViewportSize({ width: 1280, height: 900 })
  await extension.getByRole('button', { name: '关闭', exact: true }).click()
  await page.close()
})

test('manual message and whole-chat buttons merge, update and never submit the composer', async () => {
  await patch({ chatgptAutoCapture: false })
  const page = await fixture('manual-test', modern('ManualBirch'))
  await expect(page.locator('[data-ftb-chatgpt="message"]')).toHaveCount(2)
  const messageButtons = page.locator('[data-ftb-chatgpt="message"]')
  const whole = page.locator('[data-ftb-chatgpt="conversation"]')
  await expect(messageButtons.first().locator('..')).toHaveCSS('opacity', '0')
  await page.locator('#user').hover()
  await expect(messageButtons.first().locator('..')).toHaveCSS('opacity', '1')
  expect(
    await messageButtons
      .first()
      .evaluate((button) => button.previousElementSibling?.textContent)
  ).toBe('Share')
  const inputBox = await page.locator('[data-composer-body]').boundingBox()
  const saveBox = await whole.boundingBox()
  expect(saveBox!.x).toBeGreaterThanOrEqual(inputBox!.x + inputBox!.width)
  expect(saveBox!.x + saveBox!.width).toBeLessThanOrEqual(1280)
  await expect(whole).toHaveAttribute('data-save-state', 'unsaved')
  await page.waitForTimeout(4000)
  expect((await search('ManualBirchQuestion')).total).toBe(0)
  await page.locator('[data-ftb-chatgpt="message"]').nth(1).click()
  await expect
    .poll(async () => (await search('ManualBirchAnswer')).total)
    .toBe(1)
  expect((await search('ManualBirchQuestion')).total).toBe(0)
  await page.locator('[data-ftb-chatgpt="conversation"]').click()
  await expect
    .poll(
      async () => (await search('ManualBirchQuestion ManualBirchAnswer')).total
    )
    .toBe(1)
  await expect(messageButtons.first()).toHaveAttribute(
    'data-save-state',
    'saved'
  )
  await expect(whole).toHaveAttribute('data-save-state', 'saved')
  await page.reload()
  await expect(whole).toHaveAttribute('data-save-state', 'saved')
  await expect(messageButtons.first()).toHaveAttribute(
    'data-save-state',
    'saved'
  )
  const id = (await search('ManualBirchAnswer')).results[0].id
  await page.evaluate(() => {
    document.querySelector('#answer p')!.textContent = 'EditedMapleAnswer'
  })
  await expect(whole).toHaveAttribute('data-save-state', 'unsaved')
  await expect(messageButtons.last()).toHaveAttribute(
    'data-save-state',
    'unsaved'
  )
  await page.locator('[data-ftb-chatgpt="message"]').last().click()
  await expect
    .poll(async () => (await search('EditedMapleAnswer')).results[0]?.id)
    .toBe(id)
  expect((await search('ManualBirchAnswer')).total).toBe(0)
  expect(await page.locator('body').getAttribute('data-submitted')).toBeNull()
  await page.screenshot({ path: 'test-results/chatgpt-buttons.png' })
  await page.close()
})

test('settings apply to open pages, exclusions block saves, SPA conversations stay separate', async () => {
  await patch({ chatgptAutoCapture: true })
  const page = await fixture('switch-test', modern('SwitchPine'))
  await expect
    .poll(async () => (await search('SwitchPineAnswer')).total)
    .toBe(1)
  const options = await context.newPage()
  await options.goto(`chrome-extension://${extensionId}/options.html`)
  await options.getByLabel('启用 ChatGPT 对话保存', { exact: false }).uncheck()
  await expect(page.locator('[data-ftb-chatgpt]')).toHaveCount(0)
  await expect(
    options.getByLabel('自动保存 ChatGPT 对话', { exact: false })
  ).toBeDisabled()
  await page.evaluate(() => {
    document.querySelector('#answer')!.textContent = 'DisabledSpruce'
  })
  await page.waitForTimeout(4200)
  expect((await search('DisabledSpruce')).total).toBe(0)
  await options.getByLabel('启用 ChatGPT 对话保存', { exact: false }).check()
  await expect(page.locator('[data-ftb-chatgpt="message"]')).toHaveCount(2)
  await expect.poll(async () => (await search('DisabledSpruce')).total).toBe(1)
  await patch({ forbiddenURLs: ['https://chatgpt.com/c/switch-test'] })
  await expect(page.locator('[data-ftb-chatgpt]')).toHaveCount(0)
  await page.evaluate(() => {
    document.querySelector('#answer')!.textContent = 'ExcludedLarch'
  })
  await page.waitForTimeout(4200)
  expect((await search('ExcludedLarch')).total).toBe(0)
  await page.evaluate(() => {
    history.pushState({}, '', '/c/different-test')
    document.querySelector('#user')!.textContent = 'OtherConversationUser'
    document.querySelector('#answer')!.textContent = 'OtherConversationAnswer'
  })
  await expect
    .poll(async () => (await search('OtherConversationAnswer')).results[0]?.url)
    .toBe('https://chatgpt.com/c/different-test')
  expect((await search('OtherConversationUser SwitchPineQuestion')).total).toBe(
    0
  )
  await patch({ forbiddenURLs: [] })
  await options.close()
  await page.close()
})

test('legacy ChatGPT layout waits for stop control removal and handles messages added later', async () => {
  const page = await fixture(
    'legacy-test',
    '<article data-testid="conversation-turn-0"><div data-message-author-role="user" data-message-id="old-u">LegacyOakQuestion</div><div class="turn-action-controls"><button>Copy</button></div></article><article data-testid="conversation-turn-1"><div data-message-author-role="assistant" data-message-id="old-a"><p>LegacyOakAnswer</p></div><div class="turn-action-controls"><button>Copy</button></div></article><form><div id="prompt-textarea" contenteditable="true"></div><div><button data-testid="stop-button">Stop</button></div></form>'
  )
  await expect(page.locator('[data-ftb-chatgpt="message"]')).toHaveCount(2)
  await page.waitForTimeout(4200)
  expect((await search('LegacyOakAnswer')).total).toBe(0)
  await page.evaluate(() => {
    const stop = document.querySelector('[data-testid="stop-button"]')!
    stop.setAttribute('data-testid', 'send-button')
    document.querySelector('[data-message-id="old-a"]')!.textContent =
      'LegacyFinalAnswer'
  })
  await expect
    .poll(async () => (await search('LegacyFinalAnswer')).total)
    .toBe(1)
  await page.evaluate(() => {
    const message = document.createElement('article')
    message.setAttribute('data-testid', 'conversation-turn-2')
    message.innerHTML =
      '<div data-message-author-role="user" data-message-id="late-user">LateElmMessage</div><div class="turn-action-controls"><button>Copy</button></div>'
    document.body.prepend(message)
  })
  await expect(page.locator('[data-ftb-chatgpt="message"]')).toHaveCount(3)
  await expect.poll(async () => (await search('LateElmMessage')).total).toBe(1)
  await page.close()
})

test('current shared turn footer saves only the final assistant message and ignores inline controls', async () => {
  await patch({ chatgptAutoCapture: false })
  const page = await fixture(
    'shared-footer-test',
    `
    <div data-talvt-turn-state="complete">
      <div>
        <div data-chatgpt-search-message-ids="footer-user"><div data-user-message-bubble>FooterQuestion</div><div class="turn-action-controls"><button>Copy user</button></div></div>
        <div data-chatgpt-search-message-ids="footer-interim"><div data-markdown-text-style="assistant-message">InterimStep</div></div>
        <div data-chatgpt-search-message-ids="footer-answer"><div><div data-chatgpt-selection-message-id="footer-answer"><div data-markdown-text-style="assistant-message"><p>SharedFooterAnswer</p><div class="turn-action-controls" id="inline-tools"><button>Copy code</button></div></div></div></div></div>
      </div>
      <div class="turn-action-controls" id="assistant-footer"><div><button aria-label="复制">Copy</button><button>Share</button></div></div>
    </div>
    <form><div data-composer-body><div id="prompt-textarea" contenteditable="true"></div><button>Send</button></div></form>
    <style>#assistant-footer{opacity:1}</style>`
  )
  const action = page.locator(
    '#assistant-footer > [data-ftb-chatgpt="message"]'
  )
  await expect(action).toHaveCount(1)
  await expect(page.locator('#inline-tools [data-ftb-owned]')).toHaveCount(0)
  await expect(page.locator('[data-ftb-chatgpt="message"]')).toHaveCount(2)
  await action.click()
  await expect(action).toHaveAttribute('data-save-state', 'saved')
  await expect
    .poll(async () => (await search('SharedFooterAnswer')).total)
    .toBe(1)
  expect((await search('FooterQuestion')).total).toBe(0)
  expect((await search('InterimStep')).total).toBe(0)
  await page.evaluate(() => {
    const row = document.querySelector('#assistant-footer')!
    row.replaceWith(row.cloneNode(true))
  })
  await expect(action).toHaveCount(1)
  await expect(action).toHaveAttribute('data-save-state', 'saved')
  await page.close()
})
