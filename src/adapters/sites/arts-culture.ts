import { defineArticle } from '../define'
import type { SiteAdapter } from '../types'
import { hearstArticleNoise, hearstBoilerplate } from '../shared/hearst'
import { staticMediaIdentity, staticMediaNoise } from '../shared/static-media'
export const artsCultureAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'chinawriter-article',
    hosts: ['chinawriter.com.cn'],
    content: ['.end_article']
  }),
  defineArticle({
    id: 'cflac-article',
    hosts: ['cflac.org.cn'],
    content: ['.articleContent']
  }),
  defineArticle({
    id: 'chnmuseum-article',
    hosts: ['chnmuseum.cn'],
    content: ['.zl_content_right']
  }),
  defineArticle({
    id: 'palace-museum-article',
    hosts: ['dpm.org.cn'],
    content: ['#content_with_keyword']
  }),
  defineArticle({
    id: 'shanghai-museum-article',
    hosts: ['shanghaimuseum.net'],
    content: ['.site-article']
  }),
  defineArticle({
    id: 'ncpa-article',
    hosts: ['chncpa.org'],
    content: ['.detailArt article']
  }),
  defineArticle({
    id: 'history-article',
    hosts: ['history.com'],
    content: ['[id^="main-content-"]']
  }),
  defineArticle({
    id: 'metmuseum-essay',
    hosts: ['metmuseum.org'],
    content: ['article']
  }),
  defineArticle({
    id: 'tate-article',
    hosts: ['tate.org.uk'],
    content: ['.article-body__content']
  }),
  defineArticle({
    id: 'poets-article',
    hosts: ['poets.org'],
    content: ['.field--body']
  }),
  defineArticle({
    id: 'english-heritage-article',
    hosts: ['english-heritage.org.uk'],
    content: ['main']
  }),
  defineArticle({
    id: 'gushiwen-poem',
    hosts: ['gushiwen.cn', 'gushiwen.org'],
    content: ['.left .contson, .left .contyishang']
  }),
  defineArticle({
    id: 'louvre-trail',
    path: /^\/(?:en|fr)\/explore\/visitor-trails\//,
    hosts: ['louvre.fr'],
    content: ['.ParcoursNew_Infos_description']
  }),
  defineArticle({
    id: 'namoc-guide',
    hosts: ['namoc.cn'],
    content: ['.cgzn']
  }),
  defineArticle({
    id: 'artron-article',
    hosts: ['news.artron.net'],
    content: ['.newsContentBody']
  }),
  defineArticle({
    id: 'worldhistory-article',
    hosts: ['worldhistory.org'],
    content: ['.text.body']
  }),
  defineArticle({
    id: 'ctext-classic',
    hosts: ['ctext.org'],
    content: [
      '#content .text td.ctext:not(.opt), #content .text td.etext:not(.opt)'
    ]
  }),
  defineArticle({
    id: 'tmz-article',
    hosts: ['tmz.com'],
    content: ['.article--permalink .article__blocks']
  }),
  defineArticle({
    id: 'elle-article',
    revision: 4,
    ignore: hearstArticleNoise,
    excludeBlocks: hearstBoilerplate,
    hosts: ['elle.com'],
    content: ['.article-body-content']
  }),
  defineArticle({
    id: 'pagesix-article',
    revision: 3,
    ignore: ['.inline-module--newsletter'],
    hosts: ['pagesix.com'],
    content: ['.single__content']
  }),
  defineArticle({
    id: 'billboard-article',
    hosts: ['billboard.com'],
    content: ['.pmc-paywall']
  }),
  defineArticle({
    id: 'cosmopolitan-article',
    revision: 3,
    ignore: hearstArticleNoise,
    excludeBlocks: hearstBoilerplate,
    hosts: ['cosmopolitan.com'],
    content: ['.article-body-content']
  }),
  defineArticle({
    id: 'rollingstone-article',
    hosts: ['rollingstone.com'],
    content: ['.pmc-paywall']
  }),
  defineArticle({
    id: 'eonline-article',
    hosts: ['eonline.com'],
    content: ['.article-detail__main-content']
  }),
  defineArticle({
    id: 'harpersbazaar-article',
    revision: 3,
    ignore: hearstArticleNoise,
    excludeBlocks: hearstBoilerplate,
    hosts: ['harpersbazaar.com'],
    content: ['.article-body-content']
  }),
  defineArticle({
    id: 'usweekly-article',
    revision: 3,
    ignore: [
      '#recommended-posts',
      '.just-from-us-widget',
      '.in-this-article',
      '.read-more-tags'
    ],
    hosts: ['usmagazine.com'],
    content: ['.article-content']
  }),
  defineArticle({
    id: 'comicbookmovie-article',
    hosts: ['comicbookmovie.com'],
    content: ['#aContent']
  }),
  defineArticle({
    id: 'digitalspy-article',
    revision: 3,
    ignore: hearstArticleNoise,
    excludeBlocks: hearstBoilerplate,
    hosts: ['digitalspy.com'],
    content: ['.article-body-content']
  }),
  defineArticle({
    id: 'slashfilm-article',
    revision: 4,
    rootIdentity: staticMediaIdentity,
    ignore: staticMediaNoise,
    maxRoots: 1,
    hosts: ['slashfilm.com'],
    content: ['article.news-post']
  }),
  defineArticle({
    id: 'xkcd-comic',
    hosts: ['xkcd.com'],
    content: ['#comic']
  }),
  defineArticle({
    id: 'gq-article',
    hosts: ['gq.com'],
    content: ['.article__body'],
    ignore: ['[class*="Recirc"]', '[class*="Newsletter"]']
  }),
  defineArticle({
    id: 'nme-article',
    hosts: ['nme.com'],
    content: ['.article-content-wp']
  }),
  defineArticle({
    id: 'refinery29-article',
    revision: 3,
    hosts: ['refinery29.com'],
    content: ['article.r29-article-container section.body'],
    ignore: [
      '.right-rail-ad-container',
      '.section-ad',
      '.header-ad-container',
      '.ad-label'
    ]
  }),
  defineArticle({
    id: 'marieclaire-article',
    hosts: ['marieclaire.com'],
    content: ['#article-body']
  }),
  defineArticle({
    id: 'louder-article',
    hosts: ['loudersound.com'],
    content: ['#article-body']
  }),
  defineArticle({
    id: 'vogue-article',
    hosts: ['vogue.co.uk'],
    content: ['.article__body'],
    ignore: ['[class*="Recirc"]', '[class*="Newsletter"]']
  }),
  defineArticle({
    id: 'allthatsinteresting-article',
    hosts: ['allthatsinteresting.com'],
    content: ['article.post-content']
  }),
  defineArticle({
    id: 'hotnewhiphop-article',
    hosts: ['hotnewhiphop.com'],
    content: ['article']
  }),
  defineArticle({
    id: 'loudwire-article',
    revision: 3,
    ignore: ['.photogallery-wrapper'],
    hosts: ['loudwire.com'],
    content: ['.pod-content']
  }),
  defineArticle({
    id: 'yankodesign-article',
    revision: 3,
    stopBefore: [{ selector: '.yd-google-add', text: /^Add YD on Google:/ }],
    hosts: ['yankodesign.com'],
    content: ['.single-box.entry-content']
  }),
  defineArticle({
    id: 'designboom-article',
    hosts: ['designboom.com'],
    content: ['.page--main.prose']
  }),
  defineArticle({
    id: 'stylecaster-article',
    revision: 3,
    excludeBlocks: [{ selector: 'p', text: /^Related: / }],
    hosts: ['stylecaster.com'],
    content: ['[class*="_gutenbergContent_"]']
  }),
  defineArticle({
    id: 'esquire-article',
    revision: 3,
    ignore: hearstArticleNoise,
    excludeBlocks: hearstBoilerplate,
    hosts: ['esquire.com'],
    content: ['.article-body-content']
  }),
  defineArticle({
    id: 'cheezburger-story',
    hosts: ['cheezburger.com'],
    content: ['article.js-post .ck-content']
  })
]
