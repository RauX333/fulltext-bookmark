import { defineArticle, defineAdapter } from '../define'
import type { SiteAdapter } from '../types'

export const scienceEducationAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'pku-about',
    hosts: ['pku.edu.cn'],
    content: ['#swbbg_listss'],
    path: /^\/about/
  }),
  defineArticle({
    id: 'sjtu-about',
    hosts: ['sjtu.edu.cn'],
    content: ['.Article_content'],
    path: /^\/xxjj\//
  }),
  defineArticle({
    id: 'mit-ocw-about',
    hosts: ['ocw.mit.edu'],
    content: ['#about-us']
  }),
  defineArticle({
    id: 'harvard-about',
    hosts: ['harvard.edu'],
    content: ['#main-content']
  }),
  defineArticle({
    id: 'stanford-about',
    hosts: ['stanford.edu'],
    content: ['#main-content']
  }),
  defineArticle({
    id: 'cern-article',
    hosts: ['home.cern'],
    content: ['.entry-content']
  }),
  defineArticle({
    id: 'noaa-article',
    hosts: ['noaa.gov'],
    content: ['article.node--display-mode-full']
  }),
  defineArticle({
    id: 'ustc-about',
    hosts: ['ustc.edu.cn'],
    content: ['#vsb_content']
  }),
  defineArticle({
    id: 'nps-article',
    hosts: ['nps.gov'],
    content: ['#main']
  }),
  defineArticle({
    id: 'fsf-article',
    hosts: ['fsf.org'],
    content: ['#content-core']
  }),
  defineArticle({
    id: 'fudan-about',
    hosts: ['fudan.edu.cn'],
    content: ['.wp_articlecontent']
  }),
  defineArticle({
    id: 'nju-about',
    hosts: ['nju.edu.cn'],
    content: ['.ndjj'],
    path: /^\/ndgk\//
  }),
  defineArticle({
    id: 'sdu-about',
    hosts: ['sdu.edu.cn'],
    content: ['.nyMain.nyab'],
    path: /^\/sdgk\//
  }),
  defineArticle({
    id: 'tsinghua-article',
    hosts: ['tsinghua.edu.cn'],
    content: ['#vsb_content']
  }),
  defineArticle({
    id: 'zju-about',
    hosts: ['zju.edu.cn'],
    content: ['.school-content']
  }),
  defineArticle({
    id: 'khan-article',
    hosts: ['khanacademy.org'],
    content: ['.perseus-article'],
    path: /\/a\//
  }),
  defineArticle({
    id: 'nasa',
    hosts: ['science.nasa.gov'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'smithsonian',
    hosts: ['si.edu'],
    content: ['main']
  }),
  defineArticle({
    id: 'ourworldindata',
    hosts: ['ourworldindata.org'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'esa',
    hosts: ['esa.int'],
    content: ['main']
  }),
  defineArticle({
    id: 'nature',
    hosts: ['nature.com'],
    content: ['.c-article-body', '#content']
  }),
  defineArticle({
    id: 'cas',
    hosts: ['cas.cn'],
    content: ['.TRS_Editor', '.xl_xzsmdw', '.ykjj_txt']
  }),
  defineArticle({
    id: 'kepuchina-article',
    hosts: ['kepuchina.cn'],
    content: ['article.wang-editor-content']
  }),
  defineArticle({
    id: 'unicef-article',
    hosts: ['unicef.org'],
    content: ['article.ctype-page']
  }),
  defineArticle({
    id: 'unesco-article',
    hosts: ['unesco.org'],
    content: [
      '.header-node-content .field--name-field-description, .node__content .field--name-field-paragraphs'
    ]
  }),
  defineArticle({
    id: 'worldbank-release',
    hosts: ['worldbank.org'],
    content: ['.custom-text']
  }),
  defineArticle({
    id: 'sciencealert-article',
    hosts: ['sciencealert.com'],
    content: ['.post-content']
  })
]
