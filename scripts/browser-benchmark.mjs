import { build } from 'esbuild'
import { chromium } from '@playwright/test'
import { mkdtemp, cp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const path = await mkdtemp(join(tmpdir(), 'ftb-benchmark-extension-'))
await cp(resolve('build/chrome-mv3-prod'), path, { recursive: true })
await build({
  entryPoints: ['scripts/browser-benchmark-entry.ts'],
  outfile: join(path, 'benchmark.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'chrome120'
})
await writeFile(
  join(path, 'benchmark.html'),
  '<!doctype html><meta charset="utf-8"><script defer src="benchmark.js"></script>'
)
const context = await chromium.launchPersistentContext(
  await mkdtemp(join(tmpdir(), 'ftb-benchmark-profile-')),
  {
    channel: 'chrome',
    headless: true,
    args: ['--enable-unsafe-extension-debugging'],
    ignoreDefaultArgs: ['--disable-extensions']
  }
)
try {
  const session = await context.browser().newBrowserCDPSession()
  const extension = await session.send('Extensions.loadUnpacked', { path })
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extension.id}/benchmark.html`)
  const result = await page.evaluate(() => window.benchmark)
  const report = {
    browser: context.browser().version(),
    environment:
      'Installed Chrome, isolated profile, real IndexedDB; synthetic corpus',
    ...result
  }
  await mkdir('artifacts', { recursive: true })
  await writeFile(
    'artifacts/browser-benchmark.json',
    JSON.stringify(report, null, 2)
  )
  console.log(JSON.stringify(report, null, 2))
} finally {
  await context.close()
}
