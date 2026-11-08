import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adapters, defineArticle, selectAdapter } from '../src/adapters'

test('registered adapter identities and host scopes are valid', () => {
  const ids = new Set<string>()
  for (const adapter of adapters) {
    assert.ok(
      !ids.has(adapter.id),
      `duplicate persistence identity: ${adapter.id}`
    )
    ids.add(adapter.id)
    assert.ok(adapter.hosts.length && adapter.content.length, adapter.id)
    for (const host of adapter.hosts) {
      assert.equal(host, host.toLowerCase())
      assert.ok(!/[/:\s]/.test(host), host)
    }
    if (adapter.revision !== undefined)
      assert.ok(Number.isInteger(adapter.revision) && adapter.revision > 0)
    if (adapter.maxRoots !== undefined)
      assert.ok(Number.isInteger(adapter.maxRoots) && adapter.maxRoots > 0)
  }
})

test('host matching respects DNS boundaries and path-specific scope', () => {
  assert.equal(selectAdapter('NEWS.BBC.COM.')?.id, 'bbc')
  assert.equal(selectAdapter('bbc.com.evil.example'), undefined)
  assert.equal(selectAdapter('notbbc.com'), undefined)
  assert.equal(
    selectAdapter('cloud.tencent.com', '/document/product/1')?.id,
    'tencent-docs'
  )
  assert.equal(selectAdapter('cloud.tencent.com', '/account/'), undefined)
  assert.equal(
    selectAdapter('platform.kimi.com', '/docs/intro')?.id,
    'moonshot-docs'
  )
})

test('article definitions isolate content with ordered fallback roots', () => {
  const rule = defineArticle({
    id: 'example',
    hosts: ['example.test'],
    content: ['.body', 'article'],
    revision: 3
  })
  assert.equal(rule.isolate, true)
  assert.equal(rule.firstMatch, true)
  assert.deepEqual(rule.content, ['.body', 'article'])
  assert.equal(rule.revision, 3)
})
