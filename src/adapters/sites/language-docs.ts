import { defineArticle, defineAdapter } from '../define'
import type { SiteAdapter } from '../types'

export const languageDocsAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'course-rust',
    hosts: ['course.rs', 'beatai.org'],
    content: ['article.doc-content', 'main']
  }),
  defineArticle({
    id: 'wangdoc',
    hosts: ['wangdoc.com'],
    content: ['article.content']
  }),
  defineArticle({
    id: 'javascript-info',
    hosts: ['javascript.info'],
    content: ['article.formatted']
  }),
  defineArticle({
    id: 'deno-docs',
    hosts: ['docs.deno.com'],
    content: ['.markdown-body']
  }),
  defineArticle({
    id: 'bun-docs',
    hosts: ['bun.com'],
    content: ['#docs-content']
  }),
  defineArticle({
    id: 'nodejs',
    hosts: ['nodejs.org'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'typescript',
    hosts: ['typescriptlang.org'],
    content: ['.markdown', 'article', 'main']
  }),
  defineArticle({
    id: 'rust',
    hosts: ['doc.rust-lang.org'],
    content: ['main']
  }),
  defineArticle({
    id: 'go',
    hosts: ['go.dev'],
    content: ['article']
  }),
  defineArticle({
    id: 'kotlin',
    hosts: ['kotlinlang.org'],
    content: ['article'],
    ignore: ['.navigation-links']
  }),
  defineArticle({
    id: 'swift',
    hosts: ['swift.org'],
    content: ['main']
  }),
  defineArticle({
    id: 'php',
    hosts: ['php.net'],
    content: ['#layout-content']
  }),
  defineArticle({
    id: 'ruby',
    hosts: ['ruby-lang.org'],
    content: ['#content']
  }),
  defineArticle({
    id: 'java',
    hosts: ['dev.java'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'dart',
    hosts: ['dart.dev'],
    content: ['article', 'main']
  })
]
