import { defineArticle } from '../define'
import type { SiteAdapter } from '../types'
import { staticMediaIdentity, staticMediaNoise } from '../shared/static-media'
export const technologyPublishersAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'theverge-article',
    hosts: ['theverge.com'],
    content: [
      '.duet--layout--entry-body .duet--article--dangerously-set-cms-markup'
    ]
  }),
  defineArticle({
    id: 'cnet-article',
    revision: 3,
    maxRoots: 1,
    ignore: [
      '.entry-card',
      '.grid-entry',
      '.c-ccb',
      '.articleAuthorBioFooter-container'
    ],
    hosts: ['cnet.com'],
    content: ['article.post .single-page__content > .entry-content']
  }),
  defineArticle({
    id: 'mashable-article',
    revision: 3,
    ignore: ['.related-stories'],
    hosts: ['mashable.com'],
    content: ['section#article']
  }),
  defineArticle({
    id: 'gizmodo-article',
    hosts: ['gizmodo.com'],
    content: ['.entry-content']
  }),
  defineArticle({
    id: 'arstechnica-article',
    hosts: ['arstechnica.com'],
    content: ['.post-content']
  }),
  defineArticle({
    id: 'slashgear-article',
    revision: 4,
    rootIdentity: staticMediaIdentity,
    ignore: staticMediaNoise,
    maxRoots: 1,
    hosts: ['slashgear.com'],
    content: ['article.news-post']
  }),
  defineArticle({
    id: 'wired-article',
    hosts: ['wired.com'],
    content: ['.article__body'],
    ignore: ['[class*="Recirc"]', '[class*="Newsletter"]']
  }),
  defineArticle({
    id: 'futurism-article',
    revision: 3,
    ignore: ['.recurrent-newsletter-block'],
    hosts: ['futurism.com'],
    content: ['.entry-content']
  }),
  defineArticle({
    id: 'vg247-article',
    hosts: ['vg247.com'],
    content: ['.article_body_content']
  }),
  defineArticle({
    id: 'torrentfreak-article',
    hosts: ['torrentfreak.com'],
    content: ['.article__body']
  }),
  defineArticle({
    id: 'hackernews-article',
    revision: 3,
    excludeBlocks: [
      {
        selector: 'p, div',
        text: /^Found this article interesting\? Follow us on Google News, Twitter and LinkedIn to read more exclusive content we post\.$/
      }
    ],
    hosts: ['thehackernews.com'],
    content: ['#articlebody']
  }),
  defineArticle({
    id: 'labnol-article',
    revision: 3,
    stopBefore: [{ selector: 'p', text: /^Also see:$/ }],
    hosts: ['labnol.org'],
    content: ['article.prose']
  }),
  defineArticle({
    id: 'droidlife-article',
    revision: 3,
    stopBefore: [
      { selector: 'div, p, span', text: /^Add Droid Life on Google:$/ }
    ],
    hosts: ['droid-life.com'],
    content: ['.entry-content']
  }),
  defineArticle({
    id: 'techcrunch-article',
    hosts: ['techcrunch.com'],
    content: ['.entry-content.wp-block-post-content']
  }),
  defineArticle({
    id: 'sammobile-article',
    revision: 3,
    ignore: ['.content-footer', '.post-nfy-related', 'instaread-player'],
    hosts: ['sammobile.com'],
    content: ['#single-article-content']
  }),
  defineArticle({
    id: 'playstationlifestyle-article',
    hosts: ['playstationlifestyle.net'],
    content: ['.entry-content.wp-block-post-content']
  }),
  defineArticle({
    id: 'searchenginejournal-article',
    hosts: ['searchenginejournal.com'],
    content: ['article.cis_post_item_initial #narrow-cont']
  })
]
