import 'fake-indexeddb/auto'
import { PageDatabase, savePage } from '../src/database'
import { searchPages } from '../src/search'
import { performance } from 'node:perf_hooks'
import { mkdir, writeFile } from 'node:fs/promises'
const db = new PageDatabase('benchmark-' + crypto.randomUUID())
const samples: Record<string, number[]> = {}
const count = Number(process.env.BENCH_PAGES || 3000)
try {
  for (let i = 0; i < count; i++) {
    const before = performance.now()
    await savePage(
      {
        url: `https://benchmark.test/articles/${i}`,
        title: `网页检索 browser history ${i}`,
        content:
          `这是第${i}篇网页。中文全文检索和动态加载评论。 ${i % 100 === 0 ? 'RareOrchid 生僻词紫藤花' : 'common content'} ` +
          'Browser searching captures asynchronous content and comments. '.repeat(
            40
          )
      },
      db
    )
    ;(samples.save ||= []).push(performance.now() - before)
  }
  for (const [label, query] of Object.entries({
    chinese: '紫藤花',
    exact: 'RareOrchid',
    fuzzy: 'RareOrhid',
    common: 'browser history'
  })) {
    for (let i = 0; i < 25; i++) {
      const before = performance.now()
      await searchPages({ query, limit: 30 }, db)
      ;(samples[label] ||= []).push(performance.now() - before)
    }
  }
  const report = {
    environment:
      'Node + fake-indexeddb; algorithmic regression only, not disk/browser timings',
    pages: count,
    results: Object.fromEntries(
      Object.entries(samples).map(([name, times]) => {
        times.sort((a, b) => a - b)
        return [
          name,
          {
            medianMs: +times[Math.floor(times.length / 2)].toFixed(2),
            p95Ms: +times[Math.floor(times.length * 0.95)].toFixed(2)
          }
        ]
      })
    )
  }
  await mkdir('artifacts', { recursive: true })
  await writeFile('artifacts/benchmark.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  await db.delete()
}
