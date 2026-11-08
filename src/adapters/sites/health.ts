import { defineArticle } from '../define'
import type { SiteAdapter } from '../types'
import { hearstArticleNoise, hearstBoilerplate } from '../shared/hearst'
export const healthAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'dxy-article',
    hosts: ['dxy.com'],
    content: ['.article-detail-content']
  }),
  defineArticle({
    id: '39health-article',
    hosts: ['news.39.net'],
    content: ['.js_list_l_art_m']
  }),
  defineArticle({
    id: 'cleveland-health-article',
    hosts: ['health.clevelandclinic.org'],
    content: ['div.mb-rem32px.max-w-\\[780px\\]']
  }),
  defineArticle({
    id: 'nhs-article',
    hosts: ['nhs.uk'],
    content: ['article']
  }),
  defineArticle({
    id: 'who-factsheet',
    hosts: ['who.int'],
    content: ['article.sf-detail-body-wrapper']
  }),
  defineArticle({
    id: 'menshealth-article',
    revision: 4,
    ignore: hearstArticleNoise,
    excludeBlocks: hearstBoilerplate,
    hosts: ['menshealth.com'],
    content: ['.article-body-content']
  }),
  defineArticle({
    id: 'stylecraze-article',
    revision: 3,
    stopBefore: [{ selector: 'div', text: /^Was this article helpful\?$/ }],
    ignore: ['.tabs:has(.ts-fab-content)'],
    hosts: ['stylecraze.com'],
    content: ['div.entry-content']
  }),
  defineArticle({
    id: 'oprahdaily-article',
    revision: 4,
    ignore: hearstArticleNoise,
    excludeBlocks: [
      ...hearstBoilerplate,
      {
        selector: '[data-embed="embed-gallery"]',
        text: /^Member Exclusive: Read Our Trending Wellness Stories/
      }
    ],
    hosts: ['oprahdaily.com'],
    content: ['.article-body-content']
  }),
  defineArticle({
    id: 'mindbodygreen-article',
    hosts: ['mindbodygreen.com'],
    content: ['article [class*="sc-11rlt5o-4"]']
  }),
  defineArticle({
    id: 'psychcentral-article',
    revision: 3,
    ignore: ['[data-testid="driver"]', '[data-testid="multi-product"]'],
    excludeBlocks: [{ selector: 'p', text: /^Sponsor Message: / }],
    hosts: ['psychcentral.com'],
    content: ['article.article-body']
  })
]
