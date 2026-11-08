import { defineArticle } from '../define'
import type { SiteAdapter } from '../types'
export const sportsAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'dongqiudi-article',
    hosts: ['dongqiudi.com'],
    content: ['.article-body']
  }),
  defineArticle({
    id: 'titan24-article',
    hosts: ['titan24.com'],
    content: ['.articleBox-bd']
  }),
  defineArticle({
    id: 'olympic-cn-article',
    hosts: ['olympic.cn'],
    content: ['.le_con']
  }),
  defineArticle({
    id: 'skysports-article',
    hosts: ['skysports.com'],
    content: ['.sdc-article-body'],
    ignore: ['.sdc-site-related-stories', '.sdc-article-widget']
  }),
  defineArticle({
    id: 'uefa-article',
    hosts: ['uefa.com'],
    content: ['.article_summary, .article_body']
  }),
  defineArticle({
    id: 'fifa-article',
    hosts: ['fifa.com'],
    content: ['article[class*="article-section_body"]']
  }),
  defineArticle({
    id: 'espn-article',
    hosts: ['espn.com'],
    content: ['.article-body'],
    ignore: ['.ad-slot', '.inline', '[class*="newsletter"]']
  }),
  defineArticle({
    id: 'bleacher-article',
    hosts: ['bleacherreport.com'],
    content: ['[id^="id/article/slide/"]:not([id*="/element/"])']
  }),
  defineArticle({
    id: 'sportingnews-article',
    revision: 3,
    stopBefore: [{ selector: 'h2', text: /^More NBA news:$/ }],
    hosts: ['sportingnews.com'],
    content: ['#article-body']
  }),
  defineArticle({
    id: 'essentiallysports-article',
    hosts: ['essentiallysports.com'],
    content: ['article[class*="body_container"]']
  }),
  defineArticle({
    id: 'thescore-article',
    hosts: ['thescore.com'],
    content: ['#article-content']
  }),
  defineArticle({
    id: 'fansided-article',
    revision: 3,
    excludeBlocks: [
      { selector: 'p', text: /^No purchase necessary\. 50 U\.S\.\/D\.C\./ }
    ],
    ignore: ['.voltax-google-preferred-source'],
    hosts: ['fansided.com'],
    content: ['.odesa-article-main .article-content']
  }),
  defineArticle({
    id: 'sportsillustrated-article',
    hosts: ['si.com'],
    content: ['#main-article .article-content']
  })
]
