import { defineArticle, defineAdapter } from '../define'
import type { SiteAdapter } from '../types'

export const chinesePublishersAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'oschina-news',
    hosts: ['oschina.net'],
    content: ['.news-content'],
    path: /^\/news\//
  }),
  defineArticle({
    id: 'guokr-article',
    hosts: ['guokr.com'],
    content: ['[class*="styled__ArticleContent"]'],
    path: /^\/article\//
  }),
  defineArticle({
    id: 'geekpark-article',
    hosts: ['geekpark.net'],
    content: ['#article-body .article-content'],
    path: /^\/news\//
  }),
  defineArticle({
    id: 'pingwest-article',
    hosts: ['pingwest.com'],
    content: ['article.article-style'],
    path: /^\/a\//
  }),
  defineArticle({
    id: 'chinanews-article',
    hosts: ['chinanews.com.cn'],
    content: ['.left_zw']
  }),
  defineArticle({
    id: 'gmw-article',
    hosts: ['gmw.cn'],
    content: ['.u-mainText']
  }),
  defineArticle({
    id: 'chinadaily-article',
    hosts: ['chinadaily.com.cn'],
    content: ['#Content']
  }),
  defineArticle({
    id: 'jiemian-article',
    hosts: ['jiemian.com'],
    content: ['.article-content'],
    path: /^\/article\//
  }),
  defineArticle({
    id: 'ce-article',
    hosts: ['ce.cn'],
    content: ['#articleText']
  }),
  defineArticle({
    id: 'cyol-article',
    hosts: ['news.cyol.com'],
    content: ['#art_geshi']
  }),
  defineArticle({
    id: 'gcores-article',
    hosts: ['gcores.com'],
    content: ['.public-DraftEditor-content'],
    path: /^\/articles\//
  }),
  defineArticle({
    id: 'ifanr-article',
    hosts: ['ifanr.com'],
    content: ['article.c-article-content']
  }),
  defineArticle({
    id: 'tmtpost-article',
    hosts: ['tmtpost.com'],
    content: ['._content_mode article']
  }),
  defineArticle({
    id: 'cankao-article',
    hosts: ['cankaoxiaoxi.com'],
    content: ['[id*="articleContent"]']
  }),
  defineArticle({
    id: 'sspai',
    hosts: ['sspai.com'],
    content: ['.article-body', '.article-content', 'article']
  }),
  defineArticle({
    id: 'bilibili-articles',
    hosts: ['bilibili.com'],
    content: ['.opus-module-content', '.article-holder', '.page-home .feed'],
    path: /^\/(?:read|opus)(?:\/|$)/
  }),
  defineArticle({
    id: '36kr',
    hosts: ['36kr.com'],
    content: [
      '.article-content',
      '.kr-home-flow, .kr-home-column-newsflash, .kr-home-banner-left'
    ],
    ignore: ['[class*="kr-ad-"]', '.ad-item']
  }),
  defineArticle({
    id: 'thepaper',
    hosts: ['thepaper.cn'],
    content: ['[class*="index_cententWrap"]', 'main']
  }),
  defineArticle({
    id: 'people',
    hosts: ['people.com.cn'],
    content: ['.rm_txt_con', '.rm_txt', '.main'],
    ignore: ['.topb', '.rm_nav', '.copyright', '.bottm', '.pc_nav']
  }),
  defineArticle({
    id: 'xinhua',
    hosts: ['news.cn'],
    content: ['#detail', '#detailContent', '#head, #main'],
    ignore: ['.bottom', '.related', '[id^="YCADS"]']
  }),
  defineArticle({
    id: 'govcn',
    hosts: ['gov.cn'],
    content: ['.pages_content', '.content']
  }),
  defineArticle({
    id: 'cctv',
    hosts: ['news.cctv.com'],
    content: ['#text_area']
  }),
  defineArticle({
    id: 'ithome',
    hosts: ['ithome.com'],
    content: ['#paragraph', '#news'],
    ignore: ['.ad', '.adblock']
  }),
  defineArticle({
    id: 'sina-article',
    hosts: ['sina.com.cn'],
    content: ['#artibody']
  }),
  defineArticle({
    id: 'netease-article',
    hosts: ['163.com'],
    content: ['.post_body']
  }),
  defineArticle({
    id: 'sohu-article',
    hosts: ['sohu.com'],
    content: ['#mp-editor']
  }),
  defineArticle({
    id: 'ifeng-article',
    hosts: ['ifeng.com'],
    content: ['[class*="index_text_"]']
  }),
  defineArticle({
    id: 'china-org-article',
    hosts: ['china.com.cn'],
    content: ['.main > .content']
  }),
  defineArticle({
    id: 'stcn-article',
    hosts: ['stcn.com'],
    content: ['.detail-content']
  }),
  defineArticle({
    id: 'yicai-article',
    hosts: ['yicai.com'],
    content: ['#multi-text']
  }),
  defineArticle({
    id: 'caixin-article',
    hosts: ['caixin.com'],
    content: ['#Main_Content_Val'],
    ignore: ['.aitt']
  }),
  defineArticle({
    id: 'nbd-article',
    hosts: ['nbd.com.cn'],
    content: ['.g-articl-text']
  }),
  defineArticle({
    id: '21jingji-article',
    hosts: ['m.21jingji.com'],
    content: ['.main_content']
  }),
  defineArticle({
    id: 'eeo-article',
    hosts: ['eeo.com.cn'],
    content: ['.xx_boxsing']
  }),
  defineArticle({
    id: 'infzm-article',
    hosts: ['infzm.com'],
    content: ['.nfzm-content__fulltext']
  }),
  defineArticle({
    id: 'bjd-article',
    hosts: ['news.bjd.com.cn'],
    content: ['.article-content']
  }),
  defineArticle({
    id: 'shangguan-article',
    hosts: ['jfdaily.com', 'shobserver.com'],
    content: ['.news-content']
  }),
  defineArticle({
    id: 'xhby-article',
    hosts: ['xhby.net'],
    content: ['.article-content']
  }),
  defineArticle({
    id: 'ycwb-article',
    hosts: ['news.ycwb.com'],
    content: ['#imgshow']
  }),
  defineArticle({
    id: 'dzwww-article',
    hosts: ['jining.dzwww.com'],
    content: ['.news-con']
  }),
  defineArticle({
    id: 'cqnews-article',
    hosts: ['cqnews.net'],
    content: ['#main_text']
  }),
  defineArticle({
    id: 'rednet-article',
    hosts: ['video.rednet.cn'],
    content: ['article ct']
  }),
  defineArticle({
    id: 'henandaily-article',
    hosts: ['henandaily.cn'],
    content: ['.issue-wrap']
  }),
  defineArticle({
    id: 'southcn-article',
    hosts: ['theory.southcn.com'],
    content: ['#content']
  }),
  defineArticle({
    id: 'bjnews-article',
    hosts: ['bjnews.com.cn'],
    content: ['#contentStr']
  }),
  defineArticle({
    id: 'scol-article',
    hosts: ['scol.com.cn'],
    content: ['.con_text']
  })
]
