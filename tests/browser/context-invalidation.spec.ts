import { test, expect, chromium } from '@playwright/test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const fixtures = [
  {
    name: 'X post buttons',
    url: 'https://x.com/home',
    next: '/someone/status/123456789',
    button: '[data-ftb-twitter]',
    body: `<article data-testid="tweet"><div data-testid="User-Name">Someone <a role="link" href="/someone/status/123456789"><time>Today</time></a></div><div data-testid="tweetText">ReloadCedar original post</div><div role="group"><button>Like</button></div></article>`
  },
  {
    name: 'ChatGPT message buttons',
    url: 'https://chatgpt.com/c/reload-test',
    next: '/c/another-conversation',
    button: '[data-ftb-chatgpt="message"]',
    body: `<main><article data-testid="conversation-turn-0"><div data-message-author-role="user" data-message-id="reload-user">ReloadCedar question</div><div class="turn-action-controls"><button>Copy</button></div></article><article data-testid="conversation-turn-1"><div data-message-author-role="assistant" data-message-id="reload-answer">ReloadWillow answer</div><div class="turn-action-controls"><button>Copy</button></div></article></main>`
  }
]

for (const fixture of fixtures)
  for (const trigger of ['save button', 'SPA navigation'])
    test(`${fixture.name}: ${trigger} stops cleanly after reload and recovers on refresh`, async () => {
      const context = await chromium.launchPersistentContext(
        await mkdtemp(resolve(tmpdir(), 'ftb-reload-')),
        {
          channel: 'chrome',
          headless: true,
          args: ['--enable-unsafe-extension-debugging'],
          ignoreDefaultArgs: ['--disable-extensions']
        }
      )
      try {
        const cdp = await context.browser()!.newBrowserCDPSession()
        const path = resolve('build/chrome-mv3-prod')
        const { id } = await cdp.send('Extensions.loadUnpacked', { path })
        const extension = await context.newPage()
        await extension.goto(`chrome-extension://${id}/tabs/search.html`)
        await extension.evaluate(() =>
          chrome.runtime.sendMessage({
            command: 'save-settings',
            patch: { language: 'auto' }
          })
        )
        const page = await context.newPage()
        const runtime = await context.newCDPSession(page)
        const errors: string[] = []
        runtime.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
          errors.push(
            exceptionDetails.exception?.description || exceptionDetails.text
          )
        })
        await runtime.send('Runtime.enable')
        await page.route(new URL(fixture.url).origin + '/**', (route) =>
          route.fulfill({
            contentType: 'text/html',
            body: `<!doctype html><title>Reload fixture</title>${fixture.body}`
          })
        )
        await page.goto(fixture.url)
        await expect(page.locator(fixture.button).first()).toBeVisible()
        await page.locator(fixture.button).first().click()
        await expect
          .poll(async () =>
            extension.evaluate(async () => {
              const result = await chrome.runtime.sendMessage({
                command: 'search',
                request: { query: 'ReloadCedar', fuzzy: false }
              })
              return result.total
            })
          )
          .toBe(1)
        await extension.close()
        expect((await cdp.send('Extensions.loadUnpacked', { path })).id).toBe(
          id
        )
        // The old isolated world survives in this document. Exercise its click,
        // mutation, route and delayed callbacks without navigating the page away.
        if (trigger === 'save button')
          await page.locator(fixture.button).first().click()
        await page.evaluate((next) => {
          history.pushState({}, '', next)
          document.body.append(document.createElement('p'))
          window.dispatchEvent(new Event('scroll'))
          window.dispatchEvent(new PopStateEvent('popstate'))
        }, fixture.next)
        await page.waitForTimeout(2200)
        expect(errors).toEqual([])
        await expect(page.locator('[data-ftb-owned]')).toHaveCount(0)

        // Verify the old record before saving again. Use the UI's search so its
        // initial request cannot cancel a competing request from this test.
        const reopened = await context.newPage()
        await reopened.goto(`chrome-extension://${id}/tabs/search.html`)
        await reopened.getByRole('searchbox').fill('ReloadCedar')
        await expect(reopened.locator('.result-card')).toHaveCount(1)
        await expect(reopened.locator('.result-card')).toContainText(
          'ReloadCedar'
        )

        await page.goto(fixture.url)
        await expect(page.locator(fixture.button).first()).toBeVisible()
        await page.locator(fixture.button).first().click()
        await expect(page.locator(fixture.button).first()).toHaveAttribute(
          'title',
          /Saved|已保存/
        )
        expect(errors).toEqual([])
      } finally {
        await context.close()
      }
    })
