import { PageDatabase, savePage } from '../src/database'
import { searchPages } from '../src/search'
import { extractVisibleText } from '../src/capture'

;(window as any).benchmark = (async () => {
  const db = new PageDatabase('isolated-browser-benchmark')
  const samples: Record<string, number[]> = {}
  const count = 3000
  try {
    for (let i = 0; i < count; i++) {
      const start = performance.now()
      await savePage(
        {
          url: `https://benchmark.test/${i}`,
          title: `网页检索 browser history ${i}`,
          content:
            `这是第${i}篇网页。中文全文检索和动态加载评论。 ${i % 100 === 0 ? 'RareOrchid 生僻词紫藤花' : 'common content'} ` +
            'Browser searching captures asynchronous content and comments. '.repeat(
              40
            )
        },
        db
      )
      ;(samples.save ||= []).push(performance.now() - start)
    }
    for (const [name, query] of Object.entries({
      chinese: '紫藤花',
      exact: 'RareOrchid',
      fuzzy: 'RareOrhid',
      common: 'browser history'
    })) {
      for (let i = 0; i < 20; i++) {
        const start = performance.now()
        const result = await searchPages({ query, limit: 30 }, db)
        if (!result.total) throw new Error(`Missing results for ${query}`)
        ;(samples[name] ||= []).push(performance.now() - start)
      }
    }
    const article = document.createElement('article')
    for (let i = 0; i < 2000; i++) {
      const p = document.createElement('p')
      p.textContent =
        `第${i}段正文。异步加载的中文评论和 English content. `.repeat(3)
      article.append(p)
    }
    document.body.append(article)
    let characters = 0
    for (let i = 0; i < 10; i++) {
      const start = performance.now(),
        result = await extractVisibleText(article)
      characters = result.text.length
      ;(samples.capture ||= []).push(performance.now() - start)
    }
    return {
      pages: count,
      captureCharacters: characters,
      results: Object.fromEntries(
        Object.entries(samples).map(([name, times]) => {
          times.sort((a, b) => a - b)
          return [
            name,
            {
              medianMs: +times[Math.floor(times.length / 2)].toFixed(2),
              p95Ms:
                +times[
                  Math.min(times.length - 1, Math.floor(times.length * 0.95))
                ].toFixed(2)
            }
          ]
        })
      )
    }
  } finally {
    await db.delete()
  }
})()
