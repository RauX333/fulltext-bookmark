import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  allowsAutomaticCapture,
  defaults,
  migrateSettings
} from '../src/settings'
import { twitterStatusUrl } from '../src/twitter-url'

test('social sites default to manual capture, preserve switches and leave other pages alone', () => {
  const migrated = migrateSettings({
    weiboSupport: 'false',
    storeEveryPage: 'true'
  })
  assert.equal(migrated.weiboSupport, false)
  assert.equal(migrated.twitterSupport, true)
  assert.equal(migrated.weiboAutoCapture, false)
  assert.equal(migrated.twitterAutoCapture, false)
  const enabled = migrateSettings({
    ...defaults,
    weiboAutoCapture: 'true',
    twitterAutoCapture: 'true'
  })
  for (const url of [
    'https://weibo.com/home',
    'https://m.weibo.cn/detail/123',
    'https://x.com/home',
    'https://mobile.twitter.com/home'
  ]) {
    assert.equal(allowsAutomaticCapture(url, defaults), false, url)
    assert.equal(allowsAutomaticCapture(url, enabled), true, url)
    assert.equal(
      allowsAutomaticCapture(url, {
        ...enabled,
        weiboSupport: false,
        twitterSupport: false
      }),
      false,
      url
    )
  }
  assert.equal(allowsAutomaticCapture('https://example.com/', defaults), true)
  assert.equal(allowsAutomaticCapture('https://notx.com/', defaults), true)
  assert.equal(
    allowsAutomaticCapture('https://weibo.com.example.com/', defaults),
    true
  )
  assert.equal(
    allowsAutomaticCapture('https://x.com/', {
      ...enabled,
      weiboSupport: false
    }),
    true
  )
  assert.equal(
    allowsAutomaticCapture('https://weibo.com/', {
      ...enabled,
      twitterSupport: false
    }),
    true
  )
})

test('X permalink identity strips tracking and media suffixes and rejects non-post URLs', () => {
  for (const host of [
    'x.com',
    'www.x.com',
    'twitter.com',
    'mobile.twitter.com'
  ]) {
    assert.equal(
      twitterStatusUrl(
        `https://${host}/Example_User/status/123456?ref=share#text`
      ),
      'https://x.com/example_user/status/123456'
    )
    assert.equal(
      twitterStatusUrl(`https://${host}/Example_User/status/123456/photo/1`),
      'https://x.com/example_user/status/123456'
    )
    assert.equal(
      twitterStatusUrl(`https://${host}/Example_User/status/123456/video/1`),
      'https://x.com/example_user/status/123456'
    )
  }
  assert.equal(
    twitterStatusUrl('https://x.com/i/web/status/123456'),
    'https://x.com/i/web/status/123456'
  )
  for (const url of [
    'https://notx.com/user/status/1',
    'https://x.com.evil.test/user/status/1',
    'https://x.com/user',
    'https://x.com/home',
    'https://x.com/user/status/nope',
    'https://x.com/user/status/123/analytics',
    'https://user:pass@x.com/user/status/1',
    'https://x.com:8080/user/status/1',
    'ftp://x.com/user/status/1',
    'javascript:alert(1)',
    '/user/status/123'
  ]) {
    assert.equal(twitterStatusUrl(url), undefined, url)
  }
})
