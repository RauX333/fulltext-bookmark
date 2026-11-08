import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaults, isExcluded, migrateSettings } from '../src/settings'
import { settingError } from '../src/settings-validation'

test('initial exclusions protect common webmail inboxes and messages', () => {
  const settings = migrateSettings(undefined)
  assert.equal(settingError('forbiddenURLs', settings), '')
  for (const host of [
    'mail.google.com',
    'outlook.live.com',
    'outlook.office.com',
    'outlook.office365.com',
    'outlook.cloud.microsoft',
    'partner.outlook.cn',
    'mail.qq.com',
    'wx.mail.qq.com',
    'exmail.qq.com',
    'work.exmail.qq.com',
    'mail.163.com',
    'mail.126.com',
    'mail.yeah.net',
    'mail.188.com',
    'vip.163.com',
    'vip.126.com',
    'vip.188.com',
    'mail.sina.com.cn',
    'mail.sina.cn',
    'mail.sohu.com',
    'mail.aliyun.com',
    'qiye.aliyun.com',
    'mail.10086.cn',
    'html5.mail.10086.cn',
    'webmail.189.cn',
    'mail.yahoo.com',
    'us.mail.yahoo.com',
    'mail.aol.com',
    'mail.proton.me',
    'mail.protonmail.com',
    'app.fastmail.com',
    'app.tuta.com',
    'mail.tutanota.com',
    'mail.zoho.com',
    'mail.zoho.eu',
    'mail.zoho.in',
    'mail.zoho.com.cn'
  ]) {
    for (const scheme of ['https', 'http']) {
      for (const path of [
        '/',
        '/inbox?folder=personal',
        '/mail/u/0/#inbox/123'
      ]) {
        const url = `${scheme}://${host}${path}`
        assert.equal(isExcluded(url, settings.forbiddenURLs), true, url)
      }
    }
  }
})

test('iCloud exclusions cover Mail routes without blocking other apps', () => {
  for (const host of [
    'icloud.com',
    'www.icloud.com',
    'beta.icloud.com',
    'icloud.com.cn',
    'www.icloud.com.cn',
    'beta.icloud.com.cn'
  ]) {
    for (const path of [
      '/mail',
      '/mail/',
      '/mail/message/123',
      '/mail?x=1',
      '/mail#inbox'
    ])
      assert.equal(
        isExcluded(`https://${host}${path}`, defaults.forbiddenURLs),
        true,
        host + path
      )
    for (const path of ['/', '/photos/', '/notes/', '/mail-help'])
      assert.equal(
        isExcluded(`https://${host}${path}`, defaults.forbiddenURLs),
        false,
        host + path
      )
  }
})

test('webmail exclusions leave other provider sites and similar hosts available', () => {
  for (const url of [
    'https://docs.google.com/document/d/123',
    'https://www.microsoft.com/',
    'https://onedrive.live.com/',
    'https://news.qq.com/',
    'https://www.163.com/news/',
    'https://news.sina.com.cn/',
    'https://www.sohu.com/',
    'https://help.aliyun.com/',
    'https://finance.yahoo.com/',
    'https://proton.me/blog/',
    'https://www.zoho.com/docs/',
    'https://mail.google.com.example.org/',
    'https://notmail.qq.com/',
    'https://example.org/mail.google.com/inbox',
    'https://example.org/?next=mail.qq.com'
  ])
    assert.equal(isExcluded(url, defaults.forbiddenURLs), false, url)
  for (const url of [
    'https://www.google.com/search?q=test',
    'https://www.bing.com/search?q=test',
    'https://cn.bing.com/search?q=test',
    'https://www.baidu.com/s?wd=test'
  ])
    assert.equal(isExcluded(url, defaults.forbiddenURLs), true, url)
})

test('saved exclusion choices are preserved and users can opt into capturing mail', () => {
  for (const forbiddenURLs of [[], ['*private*']]) {
    const settings = migrateSettings({ forbiddenURLs })
    assert.deepEqual(settings.forbiddenURLs, forbiddenURLs)
    assert.equal(
      isExcluded('https://mail.google.com/mail/u/0/', settings.forbiddenURLs),
      false
    )
  }
  const settings = migrateSettings({
    ...defaults,
    forbiddenURLs: defaults.forbiddenURLs.filter(
      (rule) => rule !== '*://mail.google.com/*'
    )
  })
  assert.equal(
    isExcluded('https://mail.google.com/mail/u/0/', settings.forbiddenURLs),
    false
  )
  assert.equal(isExcluded('https://mail.qq.com/', settings.forbiddenURLs), true)
})
