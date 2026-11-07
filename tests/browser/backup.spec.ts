import { test, expect, chromium, type Page } from '@playwright/test'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const fixture = [
  {
    url: 'https://backup.example/chinese',
    title: '中文备份，"引号"与换行\n第二行',
    content:
      '备份紫藤 BackupWisteria\n多行正文，含逗号与"引号"。\n繁體中文和 emoji 🌱',
    date: 1794000000123,
    isBookmarked: true
  },
  {
    url: 'https://backup.example/english',
    title: '=SUM(1,2)',
    content:
      '=Formula-like text\nEnglish backup with accents: café. BackupCedar',
    date: 1794000000456,
    isBookmarked: false
  }
]

async function savedPages(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('PageDatabase')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      const tx = db.transaction(['pages', 'contents'])
      const read = (store: string) =>
        new Promise<any[]>((resolve, reject) => {
          const request = tx.objectStore(store).getAll()
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
      const [pages, contents] = await Promise.all([
        read('pages'),
        read('contents')
      ])
      return pages
        .map(({ id, url, title, date, isBookmarked }) => ({
          url,
          title,
          date,
          isBookmarked,
          content: contents.find((c) => c.pid === id)?.content
        }))
        .sort((a, b) => a.url.localeCompare(b.url))
    } finally {
      db.close()
    }
  })
}

test('real Chrome downloads named JSON, CSV and encrypted files and restores them through the UI', async () => {
  test.setTimeout(90000)
  const downloads = resolve('test-results/evidence/backup-downloads')
  await mkdir(downloads, { recursive: true })
  const context = await chromium.launchPersistentContext(
    await mkdtemp(join(tmpdir(), 'ftb-backup-profile-')),
    {
      channel: 'chrome',
      headless: false,
      viewport: { width: 1100, height: 850 },
      args: ['--enable-unsafe-extension-debugging', '--lang=zh-CN'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  try {
    const cdp = await context.browser()!.newBrowserCDPSession()
    // Preserve the actual user-facing filename on disk, not Playwright's GUID artifact name.
    await cdp.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloads,
      eventsEnabled: true
    })
    const { id } = await cdp.send('Extensions.loadUnpacked', {
      path: resolve('build/chrome-mv3-prod')
    })
    const settings = await context.newPage()
    await settings.goto(`chrome-extension://${id}/options.html`)
    await expect(settings.locator('#data')).toBeVisible()
    settings.on('dialog', (dialog) => void dialog.accept())
    const fileInput = settings.locator('input[type=file]')
    const password = settings.locator('#data input[type=password]')
    const expected = [...fixture].sort((a, b) => a.url.localeCompare(b.url))
    const seed = join(downloads, 'fixture.json')
    await writeFile(
      seed,
      JSON.stringify({
        format: 'fulltext-bookmark',
        version: 2,
        pages: fixture
      })
    )
    await fileInput.setInputFiles(seed)
    await expect(settings.getByRole('status')).toContainText(
      /已导入 2 条记录|Imported 2 pages/
    )
    expect(await savedPages(settings)).toEqual(expected)

    const search = await context.newPage()
    await search.goto(`chrome-extension://${id}/tabs/search.html`)
    const evidence: Record<string, unknown>[] = []
    for (const format of ['json', 'csv', 'encrypted.json']) {
      await settings.bringToFront()
      await password.fill('Backup-Test-正确密码-2026')
      const downloadPromise = settings.waitForEvent('download')
      await settings
        .getByRole('button', {
          name:
            format === 'json'
              ? /导出 JSON|Export JSON/
              : format === 'csv'
                ? /导出 CSV|Export CSV/
                : /导出加密备份|Export encrypted backup/,
          exact: true
        })
        .click()
      const download = await downloadPromise
      const filename = download.suggestedFilename()
      expect(filename).toMatch(
        new RegExp(
          '^Fulltext-Bookmark-\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}-\\d{2}\\.' +
            format.replaceAll('.', '\\.') +
            '$'
        )
      )
      const file = join(downloads, filename)
      await expect
        .poll(async () => {
          try {
            return (await readFile(file)).length
          } catch {
            return 0
          }
        })
        .toBeGreaterThan(0)
      const exported = await readFile(file, 'utf8')
      if (format === 'encrypted.json') {
        expect(JSON.parse(exported).encrypted).toBe(true)
        expect(exported).not.toContain('BackupWisteria')
        await password.fill('Wrong-Password-2026')
        await fileInput.setInputFiles(file)
        await expect(settings.getByRole('alert')).toContainText(
          /密码错误或备份已损坏|Wrong password or damaged backup/
        )
        expect(await savedPages(settings)).toEqual(expected)
        await password.fill('Backup-Test-正确密码-2026')
        const corrupted = JSON.parse(exported)
        corrupted.data =
          (corrupted.data[0] === 'A' ? 'B' : 'A') + corrupted.data.slice(1)
        const damaged = join(downloads, 'damaged.encrypted.json')
        await writeFile(damaged, JSON.stringify(corrupted))
        await fileInput.setInputFiles(damaged)
        await expect(settings.getByRole('alert')).toContainText(
          /密码错误或备份已损坏|Wrong password or damaged backup/
        )
        expect(await savedPages(settings)).toEqual(expected)
      } else {
        expect(exported).toContain('BackupWisteria')
      }
      const danger = settings.locator('.danger-zone')
      if (
        !(await danger.getAttribute('open')) &&
        !(await danger.evaluate((e) => (e as HTMLDetailsElement).open))
      )
        await danger.locator('summary').click()
      await settings
        .getByRole('button', {
          name: /清除全部本地记录|Delete all local records/,
          exact: true
        })
        .click()
      await expect(settings.getByRole('status')).toContainText(
        /本地记录已清除|Local records deleted/
      )
      expect(await savedPages(settings)).toEqual([])
      await fileInput.setInputFiles(file)
      await expect(settings.getByRole('status')).toContainText(
        /已导入 2 条记录|Imported 2 pages/
      )
      expect(await savedPages(settings)).toEqual(expected)
      await search.bringToFront()
      await search.reload()
      await search.locator('.search-box input').fill('BackupWisteria')
      await expect(search.locator('.result-card')).toHaveCount(1)
      await expect(search.locator('.snippet')).toContainText('BackupWisteria')
      await search.locator('.search-box input').fill('BackupCedar')
      await expect(search.locator('.result-card')).toHaveCount(1)
      await expect(search.locator('.snippet')).toContainText('BackupCedar')
      await search.screenshot({
        path: `test-results/evidence/backup-restored-${format}.png`
      })
      evidence.push({
        format,
        filename,
        bytes: Buffer.byteLength(exported),
        restored: 2,
        searchable: true
      })
      console.log(
        `Verified ${filename}: 2 complete records restored and searchable`
      )
    }
    await settings.bringToFront()
    await settings.locator('#data').scrollIntoViewIfNeeded()
    await settings.screenshot({
      path: 'test-results/evidence/backup-imported.png'
    })
    await writeFile(
      join(downloads, 'results.json'),
      JSON.stringify(
        {
          wrongPasswordPreservesData: true,
          tamperedFilePreservesData: true,
          exports: evidence
        },
        null,
        2
      )
    )
  } finally {
    await context.close()
  }
})
