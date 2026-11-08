import { test } from 'node:test'
import assert from 'node:assert/strict'
import { defaults } from '../src/settings'
import { settingError } from '../src/settings-validation'

test('settings validate numeric bounds without coercing invalid drafts', () => {
  for (const maxResults of [NaN, 0, 4, 101, 10.5])
    assert.ok(settingError('maxResults', { ...defaults, maxResults }))
  for (const days of [NaN, -1, 0.5, 36501])
    assert.ok(
      settingError('tempPageExpireTime', {
        ...defaults,
        tempPageExpireTime: days * 86400000
      })
    )
  for (const days of [0, 60, 36500])
    assert.equal(
      settingError('tempPageExpireTime', {
        ...defaults,
        tempPageExpireTime: days * 86400000
      }),
      ''
    )
})

test('settings accept supported exclusion rules and report invalid rule line numbers', () => {
  assert.equal(
    settingError('forbiddenURLs', {
      ...defaults,
      forbiddenURLs: [
        'https://example.com/*',
        '*private*',
        '/secret/i',
        '^https://example\\.com/.*'
      ]
    }).length > 0,
    true
  )
  assert.equal(
    settingError('forbiddenURLs', {
      ...defaults,
      forbiddenURLs: [
        'https://example.com/*',
        '*private*',
        '/secret/',
        '^https://example\\.com/.*',
        ''
      ]
    }),
    ''
  )
  for (const bad of [
    '/[broken/',
    '/unclosed',
    '^broken[',
    'javascript:alert(1)',
    'https://bad url'
  ])
    assert.match(
      settingError('forbiddenURLs', {
        ...defaults,
        forbiddenURLs: ['https://ok.test/*', bad]
      }),
      /2/
    )
})

test('custom API URLs and keys are checked before automatic saving', () => {
  for (const remoteStoreURL of [
    'not-a-url',
    'ftp://example.com',
    'javascript:alert(1)',
    'https://user:pass@example.com',
    'https://example.com/a b'
  ])
    assert.ok(settingError('remoteStoreURL', { ...defaults, remoteStoreURL }))
  assert.equal(settingError('remoteStoreURL', defaults), '')
  assert.ok(settingError('remoteStore', { ...defaults, remoteStore: true }))
  assert.equal(
    settingError('remoteStore', {
      ...defaults,
      remoteStore: true,
      remoteStoreURL: 'https://example.com/api'
    }),
    ''
  )
  assert.ok(
    settingError('remoteStoreKey', { ...defaults, remoteStoreKey: 'one\ntwo' })
  )
})
