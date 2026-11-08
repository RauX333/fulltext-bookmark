import {
  test,
  expect,
  chromium,
  type BrowserContext,
  type Page
} from '@playwright/test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

let context: BrowserContext, extension: Page
async function search(query: string) {
  return extension.evaluate(
    (query) =>
      chrome.runtime.sendMessage({
        command: 'search',
        request: { query, field: 'content', fuzzy: false }
      }),
    query
  )
}
async function pageAt(url: string, html: string) {
  const page = await context.newPage()
  await page.route(new URL(url).origin + '/**', (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><meta charset="utf-8">${/<title[\s>]/i.test(html) ? '' : '<title>Article audit fixture</title>'}${html}`
    })
  )
  await page.goto(url)
  return page
}
test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(
    await mkdtemp(resolve(tmpdir(), 'ftb-article-')),
    {
      channel: 'chrome',
      headless: true,
      args: ['--enable-unsafe-extension-debugging'],
      ignoreDefaultArgs: ['--disable-extensions']
    }
  )
  const cdp = await context.browser()!.newBrowserCDPSession()
  const { id } = await cdp.send('Extensions.loadUnpacked', {
    path: resolve('build/chrome-mv3-prod')
  })
  extension = await context.newPage()
  await extension.goto(`chrome-extension://${id}/tabs/search.html`)
  await extension.locator('.search-box input').waitFor()
})
test.afterAll(async () => {
  await context?.close()
})

test('publisher newsletter shadow content is excluded while later prose survives', async () => {
  const page = await pageAt(
    'https://www.elle.com/fashion/newsletter-audit',
    '<div class="article-body-content"><p>HearstOpeningCedar</p><journey-inline-newsletter></journey-inline-newsletter><div data-ad-exclude="true">This content is imported from OpenWeb. OpenWebSecret</div><p>HearstEndingWillow</p></div>'
  )
  await page.evaluate(() => {
    document
      .querySelector('journey-inline-newsletter')!
      .attachShadow({ mode: 'open' }).innerHTML =
      '<p>NewsletterShadowSecret</p>'
  })
  await expect
    .poll(async () => (await search('HearstEndingWillow')).total)
    .toBe(1)
  expect((await search('HearstOpeningCedar')).total).toBe(1)
  for (const word of ['NewsletterShadowSecret', 'OpenWebSecret'])
    expect((await search(word)).total).toBe(0)
  await page.close()
})

test('recipe rating requests do not truncate later instructions and nutrition', async () => {
  const page = await pageAt(
    'https://www.skinnytaste.com/recipe-audit',
    '<div class="entry-content"><div class="dpsp-content-wrapper">ShareCountSecret</div><a class="google-trusted-source">GoogleFollowSecret</a><p>SaladInstructionCedar</p><div class="wprm-recipe-last-step"><p>RatingRequestSecret</p></div><p>SaladNutritionWillow</p></div>'
  )
  await expect
    .poll(async () => (await search('SaladNutritionWillow')).total)
    .toBe(1)
  expect((await search('SaladInstructionCedar')).total).toBe(1)
  expect((await search('RatingRequestSecret')).total).toBe(0)
  expect((await search('GoogleFollowSecret')).total).toBe(0)
  expect((await search('ShareCountSecret')).total).toBe(0)
  await page.close()
})

test('recipe ingredients and ordered steps survive without recommendations', async () => {
  const page = await pageAt(
    'https://www.douguo.com/cookbook/audit.html',
    '<nav>RecipeNavSecret</nav><div id="left"><div class="metarial">RecipeIngredientCedar<table><tr><td>Salt</td><td>2 g</td><td>Sugar</td><td>2 g</td></tr></table></div><div class="step"><p>RecipeStepOneCedar</p><p>RecipeStepTwoCedar</p></div><div class="tips">RecipeTipCedar</div><div class="bot-list">RecipeRecommendationSecret</div></div><footer>RecipeFooterSecret</footer>'
  )
  await expect
    .poll(async () => (await search('RecipeStepTwoCedar')).total)
    .toBe(1)
  for (const text of [
    'RecipeIngredientCedar',
    'RecipeStepOneCedar',
    'RecipeTipCedar'
  ])
    expect((await search(text)).total).toBe(1)
  for (const text of [
    'RecipeNavSecret',
    'RecipeRecommendationSecret',
    'RecipeFooterSecret'
  ])
    expect((await search(text)).total).toBe(0)
  await page.close()
})

test('fragmented DXY articles retain paragraphs after the hundredth fragment', async () => {
  const fragments = Array.from(
    { length: 125 },
    (_, i) => `<div class="content-html"><p>ArticleFragment${i}Cedar</p></div>`
  ).join('')
  const page = await pageAt(
    'https://dxy.com/article/audit-fragments',
    `<div class="article-detail-content">${fragments}</div><div class="recommend">DxyRecommendationSecret</div>`
  )
  await expect
    .poll(async () => (await search('ArticleFragment124Cedar')).total)
    .toBe(1)
  expect((await search('ArticleFragment0Cedar')).total).toBe(1)
  expect((await search('DxyRecommendationSecret')).total).toBe(0)
  await page.close()
})

test('publisher access notices and slider challenges never become saved articles', async () => {
  const notices = [
    'If you are a reader experiencing an access issue, please contact support@people.inc.',
    '请滑动完成验证\n请按住滑块，拖动到最右边',
    'Sorry, your request has been blocked as it may cause potential threats to the server.',
    'Access denied.\nCheck whether a proxy or VPN is used.',
    'Checking the security of your connection...'
  ]
  for (const [i, notice] of notices.entries()) {
    const marker = `AccessNoticeCedar${i}`
    const page = await pageAt(
      `https://access-audit.example/notice-${i}`,
      `<p>${notice}</p><p>${marker}</p>`
    )
    await page.waitForTimeout(2200)
    expect((await search(marker)).total).toBe(0)
    await page.close()
  }
})

test('article fragments nested in footer or advertising containers are excluded', async () => {
  const page = await pageAt(
    'https://www.bbc.com/news/fragment-ancestors-audit',
    '<div data-component="text-block"><p>BBCArticleFragmentCedar</p></div><footer><div data-component="text-block">BBCFooterFragmentSecret</div></footer><div class="advertisement"><div data-component="text-block">BBCAdFragmentSecret</div></div>'
  )
  await expect
    .poll(async () => (await search('BBCArticleFragmentCedar')).total)
    .toBe(1)
  for (const marker of ['BBCFooterFragmentSecret', 'BBCAdFragmentSecret'])
    expect((await search(marker)).total).toBe(0)
  await page.close()
})

test('infinite-scroll publishers keep only the current article', async () => {
  const page = await pageAt(
    'https://www.slashfilm.com/123456/audit-article/',
    '<article class="news-post"><div class="news-article"><h1 data-post-id="123456">Current title</h1></div><div class="news-article"><div class="columns-holder"><p>CurrentStoryCedar</p></div></div><div class="news-article"><div class="columns-holder"><p>FinalSectionWillow</p></div></div></article>'
  )
  await expect
    .poll(async () => (await search('CurrentStoryCedar')).total)
    .toBe(1)
  await page.evaluate(() =>
    document.body.insertAdjacentHTML(
      'beforeend',
      '<article class="news-post"><h1 data-post-id="789012">Next title</h1><div class="news-article"><div class="columns-holder"><p>UnrelatedNextStorySecret</p></div></div></article>'
    )
  )
  await page.waitForTimeout(3000)
  expect((await search('UnrelatedNextStorySecret')).total).toBe(0)
  expect((await search('FinalSectionWillow')).total).toBe(1)
  await page.evaluate(() => history.pushState({}, '', '/789012/next-story/'))
  await expect
    .poll(async () => (await search('UnrelatedNextStorySecret')).total)
    .toBe(1)
  const old = await search('FinalSectionWillow')
  expect(old.total).toBe(1)
  await page.close()
})

test('publisher terminal recommendations do not truncate recipe instructions', async () => {
  const page = await pageAt(
    'https://downshiftology.com/recipes/body-boundary-audit/',
    '<article class="type-recipes"><div class="entry-content"><p hidden>Other recipes you might like:</p><p>RecipeBoundaryCedar. Other recipes you might like: is a heading we discuss here.</p><div class="wprm-recipe-container"><p>FinalInstructionWillow</p><p>NutritionCedar 243 kcal</p></div><p>Other recipes you might like:</p><a href="/other">UnrelatedRecipeSecret</a></div></article>'
  )
  await expect
    .poll(async () => (await search('FinalInstructionWillow')).total)
    .toBe(1)
  expect((await search('RecipeBoundaryCedar')).total).toBe(1)
  expect((await search('NutritionCedar')).total).toBe(1)
  expect((await search('UnrelatedRecipeSecret')).total).toBe(0)
  await page.close()
})

test('PerimeterX and device verification screens are not archived', async () => {
  for (const [title, body] of [
    ['Access to this page has been denied.', 'Please verify you are a human'],
    [
      'Access to this page has been denied',
      'Press & Hold to confirm you are a human'
    ],
    ['Verifying Device', 'Verification failed. Please try again.'],
    ['Verifying Device', 'Verifying your device, please wait']
  ]) {
    const page = await pageAt(
      'https://access-audit.example/device',
      `<title>${title}</title><p>${body}</p><p>DeviceCheckSecret</p>`
    )
    await page.waitForTimeout(2200)
    expect((await search('DeviceCheckSecret')).total).toBe(0)
    await page.close()
  }
})

test('Mintlify content cards retain visible aria-hidden text without admitting hidden cards or controls', async () => {
  const page = await pageAt(
    'https://docs.bigmodel.cn/cn/cards-audit',
    '<div id="content"><div class="card-group"><a aria-hidden="true" style="display:contents"><p>VisibleModelCardCedar</p></a><a aria-hidden="true" style="display:none">HiddenModelCardSecret</a></div><button>CopyModelButtonSecret</button><span aria-hidden="true">DecorativeModelSecret</span></div>'
  )
  await expect
    .poll(async () => (await search('VisibleModelCardCedar')).total)
    .toBe(1)
  for (const word of [
    'HiddenModelCardSecret',
    'CopyModelButtonSecret',
    'DecorativeModelSecret'
  ])
    expect((await search(word)).total).toBe(0)
  await page.close()
})

test('Can I use nested shadow roots retain compatibility data and later updates without footer ads', async () => {
  const page = await pageAt(
    'https://caniuse.com/audit-feature',
    '<ciu-feature-list style="display:block"></ciu-feature-list><footer>CompatibilityFooterSecret</footer><aside class="advertisement">CompatibilityAdSecret</aside>'
  )
  await page.evaluate(() => {
    const list = document
      .querySelector('ciu-feature-list')!
      .attachShadow({ mode: 'open' })
    list.innerHTML = '<ciu-feature style="display:block"></ciu-feature>'
    const feature = list
      .querySelector('ciu-feature')!
      .attachShadow({ mode: 'open' })
    feature.innerHTML =
      '<header><p>CompatibilityDescriptionCedar</p></header><ciu-support-table style="display:block"></ciu-support-table>'
    feature
      .querySelector('ciu-support-table')!
      .attachShadow({ mode: 'open' }).innerHTML = '<p>BrowserSupportWillow</p>'
  })
  await expect
    .poll(async () => (await search('BrowserSupportWillow')).total)
    .toBe(1)
  expect((await search('CompatibilityDescriptionCedar')).total).toBe(1)
  for (const word of ['CompatibilityFooterSecret', 'CompatibilityAdSecret'])
    expect((await search(word)).total).toBe(0)
  await page.evaluate(() => {
    document
      .querySelector('ciu-feature-list')!
      .shadowRoot!.querySelector('ciu-feature')!
      .shadowRoot!.querySelector(
        'ciu-support-table'
      )!.shadowRoot!.firstElementChild!.textContent =
      'BrowserSupportUpdatedBirch'
  })
  await expect
    .poll(async () => (await search('BrowserSupportUpdatedBirch')).total)
    .toBe(1)
  expect((await search('BrowserSupportWillow')).total).toBe(1)
  await page.close()
})

test('round two Chinese documentation and news exclude page chrome while preserving tables', async () => {
  const cases = [
    [
      'https://cloud.tencent.com/document/product/213/audit',
      '<div class="J-markdown-box">TencentArticleCedar</div>'
    ],
    [
      'https://docs.volcengine.com/docs/audit',
      '<div id="doc-viewer-container">VolcArticleCedar</div>'
    ],
    [
      'https://www.chinanews.com.cn/audit.shtml',
      '<div class="left_zw">ChinanewsArticleCedar</div>'
    ],
    [
      'https://docs.bigmodel.cn/cn/audit',
      '<div id="content"><table><tr><td>TableModelCedar</td><td>1M</td><td>128K</td></tr><tr><td>TableModelWillow</td><td>1M</td><td>128K</td></tr></table></div>'
    ]
  ]
  for (const [url, body] of cases) {
    const page = await pageAt(
      url,
      '<nav>RoundTwoNavigationSecret</nav>' +
        body +
        '<footer>RoundTwoFooterSecret</footer>'
    )
    const word = body.match(
      /(?:Tencent|Volc|Chinanews)ArticleCedar|TableModelCedar/
    )![0]
    await expect.poll(async () => (await search(word)).total).toBe(1)
    if (word === 'TableModelCedar') {
      const response = await search(word)
      const content = await extension.evaluate(async (url) => {
        const request = indexedDB.open('PageDatabase')
        const db: IDBDatabase = await new Promise((resolve) => {
          request.onsuccess = () => resolve(request.result)
        })
        const tx = db.transaction(['pages', 'contents'], 'readonly')
        const pages = tx.objectStore('pages').getAll()
        const contents = tx.objectStore('contents').getAll()
        await new Promise((resolve) => {
          tx.oncomplete = resolve
        })
        const id = pages.result.find((p) => p.url === url).id
        db.close()
        return contents.result.find((c) => c.pid === id).content
      }, url)
      expect(content).toBe(
        'TableModelCedar\n1M\n128K\nTableModelWillow\n1M\n128K'
      )
      expect(response.total).toBe(1)
    }
    expect((await search('RoundTwoNavigationSecret')).total).toBe(0)
    expect((await search('RoundTwoFooterSecret')).total).toBe(0)
    await page.close()
  }
})

test('EdgeOne, CloudFront and university error pages do not become saved articles', async () => {
  for (const title of [
    'Security Verification',
    'Access Restricted',
    'ERROR: The request could not be satisfied',
    '404错误提示',
    'Page not found | Khan Academy',
    '提示信息'
  ]) {
    const page = await pageAt(
      'https://audit-errors.example/' + encodeURIComponent(title),
      '<h1>ErrorScreenCedar</h1><p>访问地址无效 VerificationOnlyWillow</p>'
    )
    await page.evaluate((title) => {
      document.title = title
    }, title)
    await page.waitForTimeout(3000)
    expect((await search('VerificationOnlyWillow')).total).toBe(0)
    await page.close()
  }
})

test('WeChat keeps the article, references and loaded paragraphs but excludes recommendations and ads', async () => {
  const page = await pageAt(
    'https://mp.weixin.qq.com/s/audit',
    `<h1 id="activity-name">微信正文</h1><nav>WechatNavigationSecret</nav><div id="js_content"><p>WechatArticleCedar 真实正文</p><img alt="Image"><img alt="UsefulFigureCedar"><div class="advertisement">WechatAdvertSecret</div><p>ReferencesWillow 正文引用</p><div hidden>WechatHiddenSecret</div></div><div id="js_pc_qr_code">WechatRecommendationSecret</div>`
  )
  await expect
    .poll(async () => (await search('WechatArticleCedar')).total)
    .toBe(1)
  expect((await search('ReferencesWillow')).total).toBe(1)
  expect((await search('UsefulFigureCedar')).total).toBe(1)
  expect((await search('Image')).total).toBe(0)
  for (const word of [
    'WechatNavigationSecret',
    'WechatAdvertSecret',
    'WechatHiddenSecret',
    'WechatRecommendationSecret'
  ])
    expect((await search(word)).total).toBe(0)
  await page.evaluate(() =>
    document
      .querySelector('#js_content')!
      .insertAdjacentHTML('beforeend', '<p>WechatLaterMagnolia 异步正文</p>')
  )
  await expect
    .poll(async () => (await search('WechatLaterMagnolia')).total)
    .toBe(1)
  await page.close()
})

test('GitHub and Stack Overflow keep multiple discussion roots without surrounding chrome', async () => {
  const github = await pageAt(
    'https://github.com/org/repo/issues/123',
    '<nav>RepositoryNavSecret</nav><article class="markdown-body">RepositoryBodyCedar</article><div class="comment-body">RepositoryReplyWillow</div><aside>RepositorySidebarSecret</aside>'
  )
  await expect
    .poll(async () => (await search('RepositoryReplyWillow')).total)
    .toBe(1)
  expect((await search('RepositoryBodyCedar')).total).toBe(1)
  for (const word of ['RepositoryNavSecret', 'RepositorySidebarSecret'])
    expect((await search(word)).total).toBe(0)
  const stack = await pageAt(
    'https://stackoverflow.com/questions/123/audit',
    '<div class="s-prose js-post-body">QuestionCedar</div><div class="s-prose js-post-body">AnswerWillow</div><span class="comment-copy">DiscussionBirch</span><aside>RelatedQuestionSecret</aside>'
  )
  for (const word of ['QuestionCedar', 'AnswerWillow', 'DiscussionBirch'])
    await expect.poll(async () => (await search(word)).total).toBe(1)
  expect((await search('RelatedQuestionSecret')).total).toBe(0)
  await github.close()
  await stack.close()
})

test('documentation handles display:contents, hidden preferred roots and legitimate advertising prose', async () => {
  const page = await pageAt(
    'https://developer.mozilla.org/en-US/docs/audit',
    '<style>main{display:contents}</style><main id="content"><div class="reference-layout__body"><p>DocumentationCedar explains advertising and cookies.</p><pre>CodeWillow</pre><aside>ImportantWarningBirch</aside><nav>InnerNavigationSecret</nav><div id="onetrust-banner-sdk">ConsentSecret</div></div><aside>DocumentationSidebarSecret</aside></main>'
  )
  for (const word of [
    'DocumentationCedar',
    'CodeWillow',
    'ImportantWarningBirch'
  ])
    await expect.poll(async () => (await search(word)).total).toBe(1)
  for (const word of [
    'InnerNavigationSecret',
    'ConsentSecret',
    'DocumentationSidebarSecret'
  ])
    expect((await search(word)).total).toBe(0)
  const sphinx = await pageAt(
    'https://docs.python.org/3/audit',
    '<div hidden><article>HiddenArticleSecret</article></div><div role="main"><p>VisibleFallbackCedar</p></div><footer>FooterSecret</footer>'
  )
  await expect
    .poll(async () => (await search('VisibleFallbackCedar')).total)
    .toBe(1)
  expect((await search('HiddenArticleSecret')).total).toBe(0)
  expect((await search('FooterSecret')).total).toBe(0)
  await page.close()
  await sphinx.close()
})

test('waiting for an article and access challenges never pollute later captures', async () => {
  const page = await pageAt(
    'https://mp.weixin.qq.com/s/late-audit',
    '<h1>环境异常</h1><p>VerificationSecret</p>'
  )
  await page.waitForTimeout(6000)
  expect((await search('VerificationSecret')).total).toBe(0)
  await page.evaluate(() => {
    document.body.innerHTML =
      '<h1 id="activity-name">文章就绪</h1><div id="js_content">LoadedArticleBirch</div>'
  })
  await expect
    .poll(async () => (await search('LoadedArticleBirch')).total)
    .toBe(1)
  expect((await search('VerificationSecret')).total).toBe(0)
  const cloudflare = await pageAt(
    'https://www.cloudflare.com/learning/audit',
    '<h1>Performing security verification</h1><div id="challenge-stage">ChallengeSecret</div>'
  )
  await cloudflare.evaluate(() => {
    document.title = 'Just a moment...'
  })
  await cloudflare.waitForTimeout(6000)
  expect((await search('ChallengeSecret')).total).toBe(0)
  await page.close()
  await cloudflare.close()
})

test('unadapted pages retain open shadow DOM, frames and changing discussions', async () => {
  const page = await pageAt(
    'https://unadapted.example/audit',
    '<main><p>GenericArticleCedar</p><div id="shadow"></div><iframe srcdoc="<p>FrameWillow</p>"></iframe><div id="comments"></div></main>'
  )
  await page.evaluate(() => {
    document
      .querySelector('#shadow')!
      .attachShadow({ mode: 'open' }).innerHTML = '<p>ShadowMagnolia</p>'
  })
  for (const word of ['GenericArticleCedar', 'FrameWillow', 'ShadowMagnolia'])
    await expect.poll(async () => (await search(word)).total).toBe(1)
  await page.evaluate(() => {
    document.querySelector('#comments')!.textContent = 'DynamicCommentBirch'
  })
  await expect
    .poll(async () => (await search('DynamicCommentBirch')).total)
    .toBe(1)
  await page.close()
})

test('Internet Archive selects content inside open shadow roots and observes updates', async () => {
  const page = await pageAt(
    'https://archive.org/about/audit',
    '<app-root></app-root>'
  )
  await page.evaluate(() => {
    const root = document
      .querySelector('app-root')!
      .attachShadow({ mode: 'open' })
    root.innerHTML =
      '<nav>ArchiveNavigationSecret</nav><div id="content-container"><p>ArchiveArticleCedar</p><p>Help in <a><img alt="Slack">Slack</a>: get an invite.</p></div><aside>ArchiveSidebarSecret</aside>'
  })
  await expect
    .poll(async () => (await search('ArchiveArticleCedar')).total)
    .toBe(1)
  for (const word of [
    'ArchiveNavigationSecret',
    'ArchiveSidebarSecret',
    '"Slack Slack"'
  ])
    expect((await search(word)).total).toBe(0)
  await page.evaluate(() =>
    document
      .querySelector('app-root')!
      .shadowRoot!.querySelector('#content-container')!
      .insertAdjacentHTML('beforeend', '<p>ShadowUpdateBirch</p>')
  )
  await expect
    .poll(async () => (await search('ShadowUpdateBirch')).total)
    .toBe(1)
  await page.close()
})

test('BBC saves rendered article while a third-party script delays DOMContentLoaded', async () => {
  const page = await context.newPage()
  await page.route('https://www.bbc.com/news/loading-audit', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html><head><title>BBC loading</title></head><body><nav>BBCNavigationSecret</nav><article><p>BBCVisibleBeforeLoadCedar</p></article><script src="https://www.bbc.com/held-script.js"></script></body></html>'
    })
  )
  let release: (() => void) | undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('https://www.bbc.com/held-script.js', async (route) => {
    await held
    await route
      .fulfill({ contentType: 'application/javascript', body: '' })
      .catch(() => {})
  })
  try {
    await page.goto('https://www.bbc.com/news/loading-audit', {
      waitUntil: 'commit'
    })
    await expect
      .poll(async () => (await search('BBCVisibleBeforeLoadCedar')).total)
      .toBe(1)
    expect(await page.evaluate(() => document.readyState)).toBe('loading')
    expect((await search('BBCNavigationSecret')).total).toBe(0)
  } finally {
    release?.()
    await page.close()
  }
})

test('capture resumes when an access screen replaces the document element', async () => {
  const page = await pageAt(
    'https://www.nationaltrust.org.uk/discover/nature/replaced-shell',
    '<title>Radware Page</title><p>Verifying your browser before proceeding</p>'
  )
  await page.waitForTimeout(1200)
  await page.evaluate(() => {
    const replacement = new DOMParser().parseFromString(
      '<title>Nature</title><main id="content"><p>NatureReplacementCedar</p></main><footer>NatureFooterSecret</footer>',
      'text/html'
    )
    document.documentElement.replaceWith(
      document.importNode(replacement.documentElement, true)
    )
  })
  await expect
    .poll(async () => (await search('NatureReplacementCedar')).total)
    .toBe(1)
  expect((await search('NatureFooterSecret')).total).toBe(0)
  await page.close()
})

test('Kotlin also captures before parser completion and Bilibili opus excludes account chrome', async () => {
  const page = await context.newPage()
  await page.route('https://kotlinlang.org/docs/loading-audit', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><head><title>Kotlin</title></head><body><article>KotlinBeforeLoadBirch</article><script src="/held.js"></script></body>'
    })
  )
  let release: (() => void) | undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('https://kotlinlang.org/held.js', async (route) => {
    await held
    await route.fulfill({ body: '' }).catch(() => {})
  })
  try {
    await page.goto('https://kotlinlang.org/docs/loading-audit', {
      waitUntil: 'commit'
    })
    await expect
      .poll(async () => (await search('KotlinBeforeLoadBirch')).total)
      .toBe(1)
    expect(await page.evaluate(() => document.readyState)).toBe('loading')
  } finally {
    release?.()
    await page.close()
  }
  const opus = await pageAt(
    'https://www.bilibili.com/opus/1234567890',
    '<header>BilibiliAccountSecret</header><div class="opus-module-content"><p>BilibiliArticleCedar</p></div><aside>BilibiliRecommendationSecret</aside>'
  )
  await expect
    .poll(async () => (await search('BilibiliArticleCedar')).total)
    .toBe(1)
  for (const word of ['BilibiliAccountSecret', 'BilibiliRecommendationSecret'])
    expect((await search(word)).total).toBe(0)
  await opus.close()
})

test('The Verge keeps every CMS paragraph without quick-post controls or recommendations', async () => {
  const page = await pageAt(
    'https://www.theverge.com/news/1234567/capture-audit',
    '<nav>VergeNavigationSecret</nav><div class="duet--layout--entry-body"><div class="duet--content-cards--quick-post"><p>VergeAuthorSecret</p><p class="duet--article--dangerously-set-cms-markup">VergeOpeningCedar</p><div><p class="duet--article--dangerously-set-cms-markup">VergeEndingWillow</p></div><p>VergeFollowSecret</p></div><aside>VergeRecommendationSecret</aside></div><footer>VergeFooterSecret</footer>'
  )
  await expect
    .poll(async () => (await search('VergeEndingWillow')).total)
    .toBe(1)
  expect((await search('VergeOpeningCedar')).total).toBe(1)
  for (const word of [
    'VergeNavigationSecret',
    'VergeAuthorSecret',
    'VergeFollowSecret',
    'VergeRecommendationSecret',
    'VergeFooterSecret'
  ])
    expect((await search(word)).total).toBe(0)
  await page.close()
})

test('Search Engine Journal saves visible prose before a deferred script finishes', async () => {
  const page = await context.newPage()
  await page.route(
    'https://www.searchenginejournal.com/loading-audit/',
    (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Search Engine Journal</title><nav>JournalNavigationSecret</nav><article class="cis_post_item_initial"><div id="narrow-cont"><p>JournalVisibleBeforeLoadCedar</p></div></article><script defer src="/held-script.js"></script>'
      })
  )
  let release: (() => void) | undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(
    'https://www.searchenginejournal.com/held-script.js',
    async (route) => {
      await held
      await route
        .fulfill({ contentType: 'application/javascript', body: '' })
        .catch(() => {})
    }
  )
  try {
    await page.goto('https://www.searchenginejournal.com/loading-audit/', {
      waitUntil: 'commit'
    })
    await expect
      .poll(async () => (await search('JournalVisibleBeforeLoadCedar')).total)
      .toBe(1)
    expect(await page.evaluate(() => document.readyState)).toBe('interactive')
    expect((await search('JournalNavigationSecret')).total).toBe(0)
  } finally {
    release?.()
    await page.close()
  }
})
