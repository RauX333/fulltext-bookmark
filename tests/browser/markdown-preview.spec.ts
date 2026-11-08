import { test, expect, chromium } from '@playwright/test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const content = [
  '# Markdown 中文预览',
  '**加粗**与*斜体*，~~删除~~和 `inline code`。',
  '> 引用内容',
  '1. 第一步\n   - 嵌套项目\n2. 第二步',
  '- [x] 已完成\n- [ ] 待完成',
  '| 项目 | 数值 |\n| --- | ---: |\n| 中文 | 42 |',
  '```javascript\nconst greeting = "Hello, Markdown!";\nconsole.log(greeting);\n```',
  String.raw`行内公式 \(x^2 + y^2 = z^2\)，以及 $E = mc^2$。`,
  '\\[\n\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}\n\\]',
  '$$\n\\sqrt{a^2+b^2}\n$$',
  '[原站链接](../guide)',
  '<script>window.markdownUnsafe = true</script>',
  '<img src=x onerror="window.markdownUnsafe = true">',
  '[危险链接](javascript:alert%281%29)',
  String.raw`$\href{javascript:alert(1)}{unsafe}$`,
  '```text\n' + 'long-code-'.repeat(60) + '\n```',
  '| ' +
    Array.from({ length: 15 }, (_, i) => `Column ${i}`).join(' | ') +
    ' |\n' +
    '| ' +
    Array.from({ length: 15 }, () => '---').join(' | ') +
    ' |\n' +
    '| ' +
    Array.from({ length: 15 }, () => 'wide value').join(' | ') +
    ' |'
].join('\n\n')

test('saved Markdown toggles safely in both languages, all search views and conversation bubbles', async ({}, testInfo) => {
  test.setTimeout(90000)
  const context = await chromium.launchPersistentContext(
    await mkdtemp(join(tmpdir(), 'ftb-markdown-preview-')),
    {
      channel: 'chrome',
      headless: true,
      args: ['--enable-unsafe-extension-debugging'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  try {
    const errors: string[] = []
    context.on('page', (page) =>
      page.on('pageerror', (error) => errors.push(error.message))
    )
    const cdp = await context.browser()!.newBrowserCDPSession()
    const { id } = await cdp.send('Extensions.loadUnpacked', {
      path: resolve('build/chrome-mv3-prod')
    })
    const base = `chrome-extension://${id}`
    const settings = await context.newPage()
    await settings.goto(`${base}/options.html`)
    settings.on('dialog', (dialog) => void dialog.accept())
    await settings.locator('input[type=file]').setInputFiles({
      name: 'markdown-fixture.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          format: 'fulltext-bookmark',
          version: 2,
          pages: [
            {
              title: 'MarkdownArticle',
              url: 'https://markdown.example/articles/saved',
              content,
              date: Date.now()
            },
            {
              title: 'MarkdownChat',
              url: 'https://chatgpt.com/c/markdown-fixture',
              content: 'User\n**问题**\n\nChatGPT\n' + content,
              date: Date.now(),
              conversation: {
                site: 'chatgpt',
                messages: [
                  { id: 'user', role: 'user', text: '**问题**', order: 0 },
                  {
                    id: 'assistant',
                    role: 'assistant',
                    text: content,
                    order: 1
                  }
                ]
              }
            },
            {
              title: 'MarkdownEmpty',
              url: 'https://markdown.example/empty',
              content: '',
              date: Date.now()
            }
          ]
        })
      )
    })
    await expect(settings.getByRole('status')).toContainText(
      /已导入 3 条记录|Imported 3 pages/
    )
    const search = await context.newPage()
    for (const language of ['zh-CN', 'en']) {
      await settings.evaluate(async (language) => {
        await chrome.runtime.sendMessage({
          command: 'save-settings',
          patch: { language }
        })
      }, language)
      for (const surface of [
        'tabs/search.html',
        'popup.html',
        'sidepanel.html'
      ]) {
        await search.setViewportSize({
          width: surface === 'tabs/search.html' ? 1100 : 360,
          height: 760
        })
        await search.goto(`${base}/${surface}?q=MarkdownArticle`)
        await search
          .getByRole('button', { name: /查看保存的文字|Read saved text/ })
          .click()
        const dialog = search.getByRole('dialog')
        const toggle = dialog.locator('.markdown-toggle')
        await expect(dialog.locator('pre')).toHaveText(content)
        await expect(toggle).toHaveAttribute('aria-pressed', 'false')
        await expect(toggle).toHaveText(
          language === 'zh-CN' ? 'Markdown 格式显示' : 'Show Markdown'
        )
        // Keyboard activation should work just like a pointer click.
        await toggle.focus()
        await toggle.press('Enter')
        await expect(toggle).toHaveAttribute('aria-pressed', 'true')
        const body = dialog.locator('.markdown-body')
        await expect(
          body.getByRole('heading', { name: 'Markdown 中文预览' })
        ).toBeVisible()
        await expect(body.locator('strong')).toHaveText('加粗')
        await expect(body.locator('em')).toHaveText('斜体')
        await expect(body.locator('blockquote')).toHaveText('引用内容')
        await expect(body.locator('table')).toHaveCount(2)
        await expect(body.locator('input[type=checkbox]').first()).toBeChecked()
        await expect(
          body.locator('input[type=checkbox]').first()
        ).toBeDisabled()
        await expect(
          body.locator('input[type=checkbox]').last()
        ).not.toBeChecked()
        await expect(body.locator('pre .hljs-keyword')).toHaveCount(1)
        await expect(body.locator('.katex-display')).toHaveCount(2)
        await expect(body.locator('math')).toHaveCount(5)
        await expect(
          body.locator(
            'script, iframe, img, [onclick], [onerror], a[href^="javascript:"]'
          )
        ).toHaveCount(0)
        await expect(body).toContainText(
          '<script>window.markdownUnsafe = true</script>'
        )
        await expect(
          body.getByRole('link', { name: '原站链接' })
        ).toHaveAttribute('href', 'https://markdown.example/guide')
        await expect(
          body.getByRole('link', { name: '原站链接' })
        ).toHaveAttribute('target', '_blank')
        await search.evaluate(() => document.fonts.ready)
        expect(
          await search.evaluate(() => document.fonts.check('16px KaTeX_Main'))
        ).toBe(true)
        expect(
          await search.evaluate(
            () =>
              (window as unknown as { markdownUnsafe?: boolean }).markdownUnsafe
          )
        ).toBeUndefined()
        const bounds = await dialog.boundingBox()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
          search.viewportSize()!.width
        )
        expect(
          await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)
        ).toBe(true)
        // The header remains available while wide/long content scrolls inside.
        await expect(toggle).toBeInViewport()
        await expect(
          dialog.getByRole('button', { name: /^(关闭|Close)$/ })
        ).toBeInViewport()
        if (language === 'zh-CN') {
          await search.screenshot({
            path: testInfo.outputPath(
              `markdown-${surface.replaceAll('/', '-')}.png`
            )
          })
        }
        await toggle.click()
        await expect(dialog.locator('pre')).toHaveText(content)
        await expect(dialog.locator('.markdown-body')).toHaveCount(0)
        await dialog.getByRole('button', { name: /^(关闭|Close)$/ }).click()
        await search
          .getByRole('button', { name: /查看保存的文字|Read saved text/ })
          .click()
        await expect(toggle).toHaveAttribute('aria-pressed', 'false')
        await dialog.getByRole('button', { name: /^(关闭|Close)$/ }).click()
      }
    }
    await search.goto(`${base}/sidepanel.html?q=MarkdownChat`)
    await search.getByRole('button', { name: 'Read saved text' }).click()
    const chat = search.getByRole('dialog')
    await expect(chat.locator('.chat-message')).toHaveCount(2)
    await expect(chat.locator('.chat-message-user > div')).toHaveText(
      '**问题**'
    )
    await chat
      .getByRole('button', { name: 'Show Markdown', exact: true })
      .click()
    await expect(
      chat.locator('.chat-message-user .markdown-body strong')
    ).toHaveText('问题')
    await expect(chat.locator('.chat-message-assistant table')).toHaveCount(2)
    expect(
      await chat
        .locator('.chat-message-assistant .markdown-body strong')
        .evaluate((node) => getComputedStyle(node).display)
    ).toBe('inline')
    expect(
      await chat.evaluate((node) => node.scrollWidth <= node.clientWidth)
    ).toBe(true)
    await search.screenshot({
      path: testInfo.outputPath('markdown-conversation.png')
    })
    await chat.getByRole('button', { name: 'Show original text' }).click()
    await expect(chat.locator('.chat-message-assistant > div')).toHaveText(
      content
    )
    await chat.getByRole('button', { name: 'Close', exact: true }).click()
    await search.goto(`${base}/sidepanel.html?q=MarkdownEmpty`)
    await search.getByRole('button', { name: 'Read saved text' }).click()
    await expect(
      search.getByRole('button', { name: 'Show Markdown', exact: true })
    ).toBeDisabled()
    await expect(search.getByRole('dialog')).toContainText(
      'Only the title and URL are available.'
    )
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
