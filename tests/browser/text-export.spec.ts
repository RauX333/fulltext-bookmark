import { test, expect, chromium } from '@playwright/test'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

test('saved text exports Markdown and paginated PDF in both languages and compact views', async ({}, testInfo) => {
  test.setTimeout(90000)
  const context = await chromium.launchPersistentContext(
    await mkdtemp(join(tmpdir(), 'ftb-text-export-')),
    {
      channel: 'chrome',
      headless: true,
      args: ['--enable-unsafe-extension-debugging'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  try {
    // Test the print invocation without opening the native dialog. Chromium's
    // PDF printer below exercises the same document and print stylesheet.
    await context.addInitScript(() => {
      window.print = () => {
        document.documentElement.dataset.printCalls = String(
          Number(document.documentElement.dataset.printCalls || 0) + 1
        )
      }
    })
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
    const title = '导出测试 / Export: 中文 🌱'
    const savedAt = Date.now() - 3600000
    const content =
      '中文正文 café 🌱\n<script>alert("literal text")</script>\n\n' +
      Array.from(
        { length: 200 },
        (_, i) => `第 ${i + 1} 行：长文分页完整保存。 Export line ${i + 1}`
      ).join('\n') +
      '\nEXPORT_END'
    await settings.locator('input[type=file]').setInputFiles({
      name: 'export-fixture.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          format: 'fulltext-bookmark',
          version: 2,
          pages: [
            {
              title,
              url: 'https://export.example/article',
              content,
              date: savedAt,
              isBookmarked: true
            },
            {
              title: 'EmptyExport',
              url: 'https://export.example/empty',
              content: '',
              date: Date.now()
            }
          ]
        })
      )
    })
    await expect(settings.getByRole('status')).toContainText(
      /已导入 2 条记录|Imported 2 pages/
    )
    const search = await context.newPage()
    for (const locale of ['zh-CN', 'en']) {
      await settings.evaluate(async (language) => {
        const response = await chrome.runtime.sendMessage({
          command: 'settings'
        })
        await chrome.runtime.sendMessage({
          command: 'save-settings',
          settings: { ...response.settings, language }
        })
      }, locale)
      for (const surface of [
        'tabs/search.html',
        'popup.html',
        'sidepanel.html'
      ]) {
        await search.setViewportSize({
          width: surface === 'tabs/search.html' ? 1100 : 360,
          height: 700
        })
        await search.goto(`${base}/${surface}?q=Export`)
        const result = search.locator('.result-card').filter({ hasText: title })
        await result
          .getByRole('button', { name: /查看保存的文字|Read saved text/ })
          .click()
        const dialog = search.getByRole('dialog')
        const exportButton = dialog.getByRole('button', {
          name: /^(导出|Export) ▾$/
        })
        await expect(exportButton).toBeVisible()
        await expect(dialog.locator('pre')).toHaveText(content)
        await exportButton.click()
        const menu = dialog.locator('.text-export-options')
        const box = await menu.boundingBox()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(
          search.viewportSize()!.width
        )
        const downloadPromise = search.waitForEvent('download')
        const exportStartedAt = Date.now()
        await dialog
          .getByRole('button', { name: /导出 Markdown|Export Markdown/ })
          .click()
        const download = await downloadPromise
        expect(download.suggestedFilename()).toBe('导出测试 Export 中文 🌱.md')
        const markdown = await readFile((await download.path())!, 'utf8')
        const frontMatter = markdown.match(/^---\n([\s\S]*?)\n---\n/)
        expect(frontMatter).not.toBeNull()
        const metadata = Object.fromEntries(
          frontMatter![1].split('\n').map((line) => {
            const field = line.match(/^(\w+): (.+)$/)!
            return [field[1], JSON.parse(field[2])]
          })
        )
        expect(metadata).toMatchObject({
          title,
          url: 'https://export.example/article',
          saved_at: new Date(savedAt).toISOString(),
          source: 'page',
          is_bookmarked: true,
          truncated: false
        })
        expect(Date.parse(metadata.exported_at)).toBeGreaterThanOrEqual(
          exportStartedAt
        )
        expect(Date.parse(metadata.exported_at)).toBeLessThanOrEqual(Date.now())
        expect(markdown).toContain('# 导出测试 / Export: 中文 🌱')
        expect(markdown).toContain('<https://export.example/article>')
        expect(markdown).toContain('中文正文 café 🌱')
        expect(markdown).toContain(
          '第 200 行：长文分页完整保存。 Export line 200'
        )
        expect(markdown).toContain('EXPORT\\_END')
        expect(markdown).not.toContain('<script>')
        await exportButton.click()
        const pdfTabPromise = context.waitForEvent('page')
        await dialog
          .getByRole('button', { name: /导出 PDF|Export PDF/ })
          .click()
        const pdfTab = await pdfTabPromise
        await expect(pdfTab.locator('.export-document pre')).toHaveText(content)
        await expect(pdfTab.locator('.export-source')).toHaveText(
          'https://export.example/article'
        )
        const pdfMetadata = pdfTab.locator('.export-metadata')
        await expect(pdfMetadata).toBeVisible()
        for (const key of [
          'title',
          'url',
          'saved_at',
          'source',
          'is_bookmarked',
          'truncated'
        ])
          await expect(
            pdfMetadata.locator(`[data-field="${key}"] td`)
          ).toHaveText(String(metadata[key]))
        const pdfExportedAt = await pdfMetadata
          .locator('[data-field="exported_at"] td')
          .innerText()
        expect(Date.parse(pdfExportedAt)).toBeGreaterThanOrEqual(
          exportStartedAt
        )
        expect(Date.parse(pdfExportedAt)).toBeLessThanOrEqual(Date.now())
        await expect(pdfTab.locator('html')).toHaveAttribute('lang', locale)
        await expect(pdfTab.locator('html')).toHaveAttribute(
          'data-print-calls',
          '1'
        )
        await pdfTab
          .getByRole('button', { name: /另存为 PDF|Save as PDF/ })
          .click()
        await expect(pdfTab.locator('html')).toHaveAttribute(
          'data-print-calls',
          '2'
        )
        await expect(
          pdfMetadata.locator('[data-field="exported_at"] td')
        ).toHaveText(pdfExportedAt)
        if (surface === 'tabs/search.html' && locale === 'zh-CN') {
          await pdfTab.emulateMedia({ media: 'print' })
          await expect(pdfTab.locator('.export-toolbar')).toBeHidden()
          await expect(pdfMetadata).toBeVisible()
          const pdf = await pdfTab.pdf({
            path: testInfo.outputPath('saved-text.pdf'),
            preferCSSPageSize: true,
            displayHeaderFooter: false
          })
          expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
          expect(
            pdf.toString('latin1').match(/\/Type \/Page\b/g)!.length
          ).toBeGreaterThan(1)
          await pdfTab.emulateMedia({ media: 'screen' })
          await pdfTab.screenshot({
            path: testInfo.outputPath('pdf-preview.png')
          })
          await exportButton.click()
          await search.screenshot({
            path: testInfo.outputPath('export-menu.png')
          })
          await search.keyboard.press('Escape')
          await expect(dialog).toBeVisible()
        }
        await pdfTab.close()
        await search.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
      }
    }
    await search.goto(`${base}/tabs/search.html?q=EmptyExport`)
    await search
      .getByRole('button', { name: /查看保存的文字|Read saved text/ })
      .click()
    await expect(
      search
        .getByRole('dialog')
        .getByRole('button', { name: /^(导出|Export) ▾$/ })
    ).toBeDisabled()
    await search.goto(`${base}/tabs/export.html?id=9999999`)
    await expect(search.getByRole('alert')).toContainText(
      'Saved text was not found'
    )
    await expect(search.locator('html')).not.toHaveAttribute(
      'data-print-calls',
      /.+/
    )
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
