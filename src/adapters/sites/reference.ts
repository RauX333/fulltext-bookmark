import { defineArticle, defineAdapter } from '../define'
import type { SiteAdapter } from '../types'

export const referenceAdapters: SiteAdapter[] = [
  defineAdapter({
    id: 'wikipedia',
    isolate: true,
    hosts: ['wikipedia.org', 'wiktionary.org', 'wiki.archlinux.org'],
    ignore: [
      '.navbox',
      '.vertical-navbox',
      '.mw-editsection',
      '.vector-toc',
      '.reflist .mw-cite-backlink'
    ],
    content: ['.mw-parser-output'],
    title: ['#firstHeading']
  }),
  defineArticle({
    id: 'gutenberg',
    hosts: ['gutenberg.org'],
    content: ['#content']
  }),
  defineArticle({
    id: 'internet-archive',
    hosts: ['archive.org'],
    content: ['#content-container', 'main', '#maincontent'],
    shadow: true,
    path: /^\/about(?:\/|$)/
  }),
  defineArticle({
    id: 'w3c',
    hosts: ['w3.org'],
    content: ['main']
  }),
  defineArticle({
    id: 'ietf',
    hosts: ['ietf.org'],
    content: ['main']
  }),
  defineArticle({
    id: 'eff',
    hosts: ['eff.org'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'douban-books',
    hosts: ['book.douban.com'],
    content: ['#content .article', '#content']
  })
]
