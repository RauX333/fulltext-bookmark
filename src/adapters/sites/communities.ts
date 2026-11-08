import { defineArticle, defineAdapter } from '../define'
import type { SiteAdapter } from '../types'

export const communitiesAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'devto-article',
    hosts: ['dev.to'],
    content: ['#article-body']
  }),
  defineAdapter({
    id: 'weixin',
    isolate: true,
    hosts: ['mp.weixin.qq.com'],
    content: ['#js_content'],
    title: ['#activity-name']
  }),
  defineAdapter({
    id: 'zhihu',
    isolate: true,
    hosts: ['zhihu.com'],
    content: [
      '.RichContent-inner',
      '.Post-RichTextContainer',
      '.CommentContent',
      '.RichText'
    ],
    title: ['.Post-Title', '.QuestionHeader-title']
  }),
  defineAdapter({
    id: 'weibo',
    hosts: ['weibo.com', 'weibo.cn'],
    content: [
      '[class*="detail_wbtext"]',
      '[class*="wbpro-feed-content"]',
      '.weibo-text',
      '[node-type="feed_list_content_full"]',
      '[node-type="feed_list_content"]'
    ]
  }),
  defineAdapter({
    id: 'twitter',
    hosts: ['x.com', 'twitter.com'],
    content: [
      '[data-testid="tweetText"]',
      '[data-testid="tweetArticleRichTextView"]'
    ]
  }),
  defineAdapter({
    id: 'github',
    isolate: true,
    hosts: ['github.com'],
    content: [
      'article.markdown-body',
      '.markdown-body',
      '.comment-body',
      '[data-testid="issue-body"]',
      '[data-testid="issue-comment-body"]'
    ]
  }),
  defineAdapter({
    id: 'stackexchange',
    isolate: true,
    hosts: [
      'stackoverflow.com',
      'stackexchange.com',
      'superuser.com',
      'serverfault.com',
      'askubuntu.com'
    ],
    content: ['.s-prose', '.js-post-body', '.comment-copy'],
    title: ['#question-header h1']
  }),
  defineAdapter({
    id: 'juejin',
    isolate: true,
    hosts: ['juejin.cn'],
    content: ['.article-content', '.markdown-body', '.comment-content'],
    title: ['.article-title']
  }),
  defineAdapter({
    id: 'csdn',
    isolate: true,
    ignore: [
      '.hide-article-box',
      '.blog-extension-box',
      '.recommend-box',
      '.recommend-item-box',
      '.hljs-button'
    ],
    hosts: ['csdn.net'],
    content: ['#content_views', '.comment-list'],
    title: ['.title-article']
  }),
  defineAdapter({
    id: 'notion',
    hosts: ['notion.so', 'notion.site'],
    content: ['.notion-page-content']
  }),
  defineAdapter({
    id: 'medium',
    hosts: ['medium.com', 'substack.com'],
    content: ['article', '.available-content', '.body.markup']
  }),
  defineArticle({
    id: 'cnblogs',
    hosts: ['cnblogs.com'],
    content: ['#cnblogs_post_body, #blog-comments-placeholder', '#post_list']
  }),
  defineArticle({
    id: 'v2ex',
    hosts: ['v2ex.com'],
    content: ['.topic_content, .reply_content']
  }),
  defineArticle({
    id: 'hackernews',
    hosts: ['news.ycombinator.com'],
    content: [
      '.itemlist, tr.athing.submission, tr:has(> .subtext), .comment-tree, .toptext'
    ]
  })
]
