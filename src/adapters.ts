export interface SiteAdapter {
  id: string
  hosts: string[]
  content: string[]
  title?: string[]
}
// These small rules select already-rendered content; they never fetch private APIs,
// bypass access controls, or discard a page when its markup has changed.
export const adapters: SiteAdapter[] = [
  {
    id: 'weixin',
    hosts: ['mp.weixin.qq.com'],
    content: ['#js_content'],
    title: ['#activity-name']
  },
  {
    id: 'zhihu',
    hosts: ['zhihu.com'],
    content: [
      '.RichContent-inner',
      '.Post-RichTextContainer',
      '.CommentContent',
      '.RichText'
    ],
    title: ['.Post-Title', '.QuestionHeader-title']
  },
  {
    id: 'weibo',
    hosts: ['weibo.com', 'weibo.cn'],
    content: [
      '[class*="detail_wbtext"]',
      '[class*="wbpro-feed-content"]',
      '.weibo-text',
      '[node-type="feed_list_content_full"]',
      '[node-type="feed_list_content"]'
    ]
  },
  {
    id: 'github',
    hosts: ['github.com'],
    content: [
      'article.markdown-body',
      '.markdown-body',
      '.comment-body',
      '[data-testid="issue-body"]',
      '[data-testid="issue-comment-body"]'
    ]
  },
  {
    id: 'stackexchange',
    hosts: [
      'stackoverflow.com',
      'stackexchange.com',
      'superuser.com',
      'serverfault.com',
      'askubuntu.com'
    ],
    content: ['.s-prose', '.js-post-body', '.comment-copy'],
    title: ['#question-header h1']
  },
  {
    id: 'wikipedia',
    hosts: ['wikipedia.org'],
    content: ['.mw-parser-output'],
    title: ['#firstHeading']
  },
  {
    id: 'juejin',
    hosts: ['juejin.cn'],
    content: ['.article-content', '.markdown-body', '.comment-content'],
    title: ['.article-title']
  },
  {
    id: 'csdn',
    hosts: ['csdn.net'],
    content: ['#content_views', '.comment-list'],
    title: ['.title-article']
  },
  {
    id: 'notion',
    hosts: ['notion.so', 'notion.site'],
    content: ['.notion-page-content']
  },
  {
    id: 'medium',
    hosts: ['medium.com', 'substack.com'],
    content: ['article', '.available-content', '.body.markup']
  }
]
export function selectAdapter(host: string) {
  return adapters.find((adapter) =>
    adapter.hosts.some(
      (domain) => host === domain || host.endsWith('.' + domain)
    )
  )
}
export function preferredRoots(document: Document, host: string): Element[] {
  const selectors = selectAdapter(host)?.content || [
    'article',
    'main',
    '[role="main"]'
  ]
  const found = [...document.querySelectorAll(selectors.join(','))]
  return found
    .filter(
      (node) =>
        !found.some((parent) => parent !== node && parent.contains(node))
    )
    .slice(0, 100)
}
export function pageTitle(document: Document, host: string) {
  const selectors = selectAdapter(host)?.title
  return (
    (selectors &&
      document.querySelector(selectors.join(','))?.textContent?.trim()) ||
    document.title
  )
}
