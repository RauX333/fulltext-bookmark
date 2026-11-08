import { defineArticle, defineAdapter } from '../define'
import type { SiteAdapter } from '../types'

export const internationalPublishersAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'css-tricks-article',
    hosts: ['css-tricks.com'],
    content: ['main > article', 'main article']
  }),
  defineArticle({
    id: 'smashing-article',
    hosts: ['smashingmagazine.com'],
    content: ['.c-garfield-the-cat', '#article__content'],
    ignore: ['[class*="c-garfield-aside"]']
  }),
  defineArticle({
    id: 'cnn',
    hosts: ['cnn.com'],
    content: ['.article__content', '.section', 'main']
  }),
  defineArticle({
    id: 'guardian',
    hosts: ['theguardian.com'],
    content: ['[data-gu-name="body"]', '#maincontent'],
    ignore: ['.ad-slot']
  }),
  defineArticle({
    id: 'npr',
    hosts: ['npr.org'],
    content: ['#storytext', '#main-section', 'main']
  }),
  defineArticle({
    id: 'nationalgeographic',
    hosts: ['nationalgeographic.com'],
    content: ['.Article__Content', '.PageLayout__Main']
  }),
  defineArticle({
    id: 'bbc',
    hosts: ['bbc.com', 'bbc.co.uk'],
    content: ['[data-component="text-block"]', 'article', 'main']
  }),
  defineArticle({
    id: 'un-news-article',
    hosts: ['news.un.org'],
    content: [
      'main#content .views-field-field-news-story-lead, main#content .field--name-field-text-column'
    ]
  }),
  defineArticle({
    id: 'imf-blog',
    hosts: ['imf.org'],
    content: ['article']
  }),
  defineArticle({
    id: 'businessinsider-article',
    revision: 3,
    ignore: ['.games-discovery-module'],
    hosts: ['businessinsider.com'],
    content: ['.post-story-body-content']
  }),
  defineArticle({
    id: 'hotair-article',
    revision: 3,
    excludeBlocks: [
      {
        selector: 'p',
        text: /^Help us continue to report on .*Join HotAir VIP/
      }
    ],
    hosts: ['hotair.com'],
    content: ['article.article-body']
  }),
  defineArticle({
    id: 'entrepreneur-article',
    hosts: ['entrepreneur.com'],
    content: ['.gate-check.piano-check']
  }),
  defineArticle({
    id: 'hbr-article',
    hosts: ['hbr.org'],
    content: [
      'article#main > div[class*="_container"] > div[class*="_content"]'
    ]
  }),
  defineArticle({
    id: 'zerohedge-contributor',
    hosts: ['zerohedge.com'],
    content: ['[class*="ContributorContent_body"]']
  }),
  defineArticle({
    id: 'coindesk-article',
    hosts: ['coindesk.com'],
    content: ['.document-body']
  })
]
