import { test, expect, chromium } from '@playwright/test'
import { mkdtemp, writeFile, cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

test('Chrome upgrades the original IndexedDB and Redux settings in place under the same extension ID', async () => {
  const path = await mkdtemp(join(tmpdir(), 'ftb-upgrade-extension-'))
  await writeFile(
    join(path, 'manifest.json'),
    JSON.stringify({
      manifest_version: 3,
      name: 'Fulltext Bookmark upgrade fixture',
      version: '1.1.9',
      permissions: ['storage', 'unlimitedStorage']
    })
  )
  await writeFile(
    join(path, 'seed.html'),
    '<!doctype html><title>Upgrade fixture</title>'
  )
  const context = await chromium.launchPersistentContext(
    await mkdtemp(join(tmpdir(), 'ftb-upgrade-profile-')),
    {
      channel: 'chrome',
      headless: !process.env.HEADED,
      args: ['--enable-unsafe-extension-debugging'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  try {
    const cdp = await context.browser()!.newBrowserCDPSession()
    const loaded = await cdp.send('Extensions.loadUnpacked', { path })
    const page = await context.newPage()
    await page.goto(`chrome-extension://${loaded.id}/seed.html`)
    await page.evaluate(async () => {
      await chrome.storage.local.set({
        'persist:fulltextbookmark': JSON.stringify({
          maxResults: '50',
          storeEveryPage: 'false',
          tempPageExpireTime: '5184000000',
          forbiddenURLs: JSON.stringify(['*private*']),
          weiboSupport: 'false',
          searchEngineAdaption: 'false'
        })
      })
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('PageDatabase', 10) // Dexie v1 = native IDB version 10.
        request.onupgradeneeded = () => {
          const db = request.result
          const pages = db.createObjectStore('pages', {
            keyPath: 'id',
            autoIncrement: true
          })
          for (const key of ['url', 'title', 'date', 'pageId', 'isBookmarked'])
            pages.createIndex(key, key)
          const contents = db.createObjectStore('contents', { keyPath: 'pid' })
          contents.createIndex('contentWords', 'contentWords', {
            multiEntry: true
          })
          contents.createIndex('titleWords', 'titleWords', { multiEntry: true })
          contents.createIndex('content', 'content')
          const vectors = db.createObjectStore('vectors', {
            keyPath: 'id',
            autoIncrement: true
          })
          vectors.createIndex('pid', 'pid')
          vectors.createIndex('serial', 'serial')
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['pages', 'contents', 'vectors'], 'readwrite')
        for (const id of [42, 43]) {
          tx.objectStore('pages').put({
            id,
            url: `https://legacy.example/${id}`,
            title: '旧版本全文书签',
            date: 1234,
            pageId: 'original-' + id,
            isBookmarked: id === 42
          })
          tx.objectStore('contents').put({
            pid: id,
            content: '升级后直接搜索 LegacyOrchid ' + id,
            contentWords: ['old-token'],
            titleWords: []
          })
        }
        tx.objectStore('vectors').put({
          id: 7,
          pid: 42,
          serial: 1,
          legacy: 'preserve'
        })
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
      db.close()
    })
    await page.close()
    await cp(resolve('build/chrome-mv3-prod'), path, { recursive: true })
    expect((await cdp.send('Extensions.loadUnpacked', { path })).id).toBe(
      loaded.id
    )
    const updated = await context.newPage()
    await updated.goto(`chrome-extension://${loaded.id}/tabs/search.html`)
    await expect
      .poll(
        async () =>
          (
            await updated.evaluate(() =>
              chrome.runtime.sendMessage({
                command: 'search',
                request: { query: 'LegacyOrchid' }
              })
            )
          ).total
      )
      .toBe(2)
    const result = await updated.evaluate(async () => {
      const settings = await chrome.runtime.sendMessage({ command: 'settings' })
      const search = await chrome.runtime.sendMessage({
        command: 'search',
        request: { query: 'LegacyOrchid' }
      })
      return { settings: settings.settings, results: search.results }
    })
    expect(result.settings).toMatchObject({
      maxResults: 50,
      storeEveryPage: false,
      weiboSupport: false,
      searchEngineAdaption: false,
      forbiddenURLs: ['*private*']
    })
    expect(result.results.map((r: any) => r.id).sort()).toEqual([42, 43])
    expect(result.results[0].date).toBe(1234)
    expect(result.results.find((r: any) => r.id === 42).isBookmarked).toBe(true)
    expect(result.results.find((r: any) => r.id === 43).isBookmarked).toBe(
      false
    )
  } finally {
    await context.close()
  }
})
