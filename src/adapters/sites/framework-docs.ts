import { defineArticle, defineAdapter } from '../define'
import type { SiteAdapter } from '../types'

export const frameworkDocsAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'hello-algo',
    hosts: ['hello-algo.com'],
    content: ['article.md-content__inner']
  }),
  defineArticle({
    id: 'oi-wiki',
    hosts: ['oi-wiki.org'],
    content: ['article.md-content__inner']
  }),
  defineArticle({
    id: 'bootcss',
    hosts: ['bootcss.com'],
    content: ['.bd-content', 'main']
  }),
  defineArticle({
    id: 'layui-docs',
    hosts: ['layui.dev'],
    content: ['#WS-text'],
    path: /^\/docs\//
  }),
  defineArticle({
    id: 'element-plus',
    hosts: ['element-plus.org'],
    content: ['#page-content']
  }),
  defineArticle({
    id: 'ant-design',
    hosts: ['ant.design'],
    content: ['article']
  }),
  defineArticle({
    id: 'learnku-docs',
    hosts: ['learnku.com'],
    content: ['.content-body'],
    path: /^\/docs\//
  }),
  defineArticle({
    id: 'paddle-docs',
    hosts: ['paddlepaddle.org.cn'],
    content: ['.paddle-doc-page-content']
  }),
  defineArticle({
    id: 'freecodecamp-article',
    hosts: ['freecodecamp.org'],
    content: ['.post-content']
  }),
  defineArticle({
    id: 'w3schools',
    hosts: ['w3schools.com'],
    content: ['#main'],
    ignore: [
      '#mainLeaderboard',
      '.w3-clear.nextprev',
      '.w3-example + .w3-clear'
    ]
  }),
  defineArticle({
    id: 'geeksforgeeks',
    hosts: ['geeksforgeeks.org'],
    content: ['.article--viewer_content .text']
  }),
  defineArticle({
    id: 'tutorialspoint',
    hosts: ['tutorialspoint.com'],
    content: ['#mainContent']
  }),
  defineArticle({
    id: 'django-docs',
    hosts: ['docs.djangoproject.com'],
    content: ['#docs-content']
  }),
  defineArticle({
    id: 'flask-docs',
    hosts: ['flask.palletsprojects.com'],
    content: ['.body[role="main"]']
  }),
  defineArticle({
    id: 'fastapi-docs',
    hosts: ['fastapi.tiangolo.com'],
    content: ['article.md-content__inner']
  }),
  defineArticle({
    id: 'spring-docs',
    hosts: ['spring.io'],
    content: ['.ascii-doc']
  }),
  defineArticle({
    id: 'laravel-docs',
    hosts: ['laravel.com'],
    content: ['.docs_main']
  }),
  defineArticle({
    id: 'symfony-docs',
    hosts: ['symfony.com'],
    content: ['article.content']
  }),
  defineArticle({
    id: 'rails-docs',
    hosts: ['guides.rubyonrails.org'],
    content: ['#article-body']
  }),
  defineArticle({
    id: 'astro-docs',
    hosts: ['docs.astro.build'],
    content: ['.sl-markdown-content']
  }),
  defineArticle({
    id: 'tauri-docs',
    hosts: ['v2.tauri.app'],
    content: ['.sl-markdown-content']
  }),
  defineArticle({
    id: 'flutter-docs',
    hosts: ['docs.flutter.dev'],
    content: ['#page-content article']
  }),
  defineArticle({
    id: 'express-docs',
    hosts: ['expressjs.com'],
    content: ['main article']
  }),
  defineArticle({
    id: 'mindspore-docs',
    hosts: ['mindspore.cn'],
    content: ['.rst-content']
  }),
  defineArticle({
    id: 'electron-docs',
    hosts: ['electronjs.org'],
    content: ['.theme-doc-markdown']
  }),
  defineArticle({
    id: 'webdev-docs',
    hosts: ['web.dev'],
    content: ['.devsite-article-body']
  }),
  defineArticle({
    id: 'caniuse-feature',
    hosts: ['caniuse.com'],
    content: ['ciu-feature'],
    shadow: true
  }),
  defineArticle({
    id: 'sphinx-docs',
    hosts: [
      'docs.python.org',
      'docs.pytorch.org',
      'docs.godotengine.org',
      'docs.blender.org'
    ],
    content: ['article', '[role="main"]']
  }),
  defineArticle({
    id: 'tensorflow',
    hosts: ['tensorflow.org'],
    content: ['.devsite-article-body']
  }),
  defineArticle({
    id: 'react',
    hosts: ['react.dev'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'vitepress',
    hosts: ['vuejs.org', 'vite.dev'],
    content: ['.vp-doc', 'main']
  }),
  defineArticle({
    id: 'angular',
    hosts: ['angular.dev'],
    content: ['.docs-viewer', 'main']
  }),
  defineArticle({
    id: 'svelte',
    hosts: ['svelte.dev'],
    content: ['.markdown', 'main']
  }),
  defineArticle({
    id: 'nextjs',
    hosts: ['nextjs.org'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'nuxt',
    hosts: ['nuxt.com'],
    content: ['.prose', 'main']
  }),
  defineArticle({
    id: 'ruanyifeng',
    hosts: ['ruanyifeng.com'],
    content: ['#main-content']
  }),
  defineArticle({
    id: 'runoob',
    hosts: ['runoob.com'],
    content: ['#content'],
    ignore: ['#nav_next_prev', '.article-intro ~ .sidebar-box']
  }),
  defineArticle({
    id: 'liaoxuefeng',
    hosts: ['liaoxuefeng.com'],
    content: ['#gsi-chapter-content', 'article', 'main']
  })
]
