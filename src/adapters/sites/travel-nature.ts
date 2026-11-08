import { defineArticle } from '../define'
import type { SiteAdapter } from '../types'
export const travelNatureAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'dili360-article',
    hosts: ['dili360.com'],
    content: ['article > section']
  }),
  defineArticle({
    id: 'ctrip-travelogue',
    hosts: ['you.ctrip.com'],
    content: ['.rich-text-container']
  }),
  defineArticle({
    id: 'lonelyplanet-article',
    hosts: ['lonelyplanet.com'],
    content: ['.content-block']
  }),
  defineArticle({
    id: 'roughguides-article',
    hosts: ['roughguides.com'],
    content: ['article.content-body']
  }),
  defineArticle({
    id: 'cntraveler-gallery',
    path: /^\/galleries\//,
    hosts: ['cntraveler.com'],
    content: ['article.gallery'],
    ignore: ['[class*="Related"], [class*="Recirc"], [class*="Newsletter"]']
  }),
  defineArticle({
    id: 'national-trust-article',
    revision: 3,
    hosts: ['nationaltrust.org.uk'],
    content: ['main#content'],
    ignore: [
      '.slick-cloned',
      '#you-might-also-be-interested-in + section',
      'main#content > section:has(article)'
    ]
  }),
  defineArticle({
    id: 'wwf-uk-project',
    hosts: ['wwf.org.uk'],
    content: ['article#main-content']
  }),
  defineArticle({
    id: 'rhs-garden-article',
    hosts: ['rhs.org.uk'],
    content: ['#content .section__container']
  }),
  defineArticle({
    id: 'audubon-science',
    hosts: ['audubon.org'],
    content: ['main#main .nas-ssn-section'],
    ignore: [
      '.editorial-cards-list-wrapper',
      '.nas-site-section-navigation .nas-ssn-subpage'
    ]
  }),
  defineArticle({
    id: 'thepointsguy-article',
    hosts: ['thepointsguy.com'],
    content: ['article[class*="editorial-body"]']
  })
]
