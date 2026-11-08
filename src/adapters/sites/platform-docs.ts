import { defineArticle, defineAdapter } from '../define'
import type { SiteAdapter } from '../types'

export const platformDocsAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'tencent-docs',
    hosts: ['cloud.tencent.com'],
    content: ['.J-markdown-box'],
    path: /^\/document\//
  }),
  defineArticle({
    id: 'aliyun-docs',
    hosts: ['help.aliyun.com'],
    content: ['.markdown-body']
  }),
  defineArticle({
    id: 'baidu-cloud-product',
    hosts: ['cloud.baidu.com'],
    content: ['#product-content'],
    path: /^\/product\//
  }),
  defineArticle({
    id: 'modelscope-docs',
    hosts: ['modelscope.cn'],
    content: ['.markdown-body'],
    path: /^\/docs\//
  }),
  defineArticle({
    id: 'bigmodel-docs',
    hosts: ['docs.bigmodel.cn'],
    content: ['#content'],
    visibleAriaHidden: ['.card-group a[aria-hidden="true"]']
  }),
  defineArticle({
    id: 'moonshot-docs',
    hosts: ['platform.moonshot.cn', 'platform.kimi.com'],
    content: ['#content'],
    visibleAriaHidden: ['.card-group a[aria-hidden="true"]'],
    path: /^\/docs\//
  }),
  defineArticle({
    id: 'deepseek-docs',
    hosts: ['api-docs.deepseek.com'],
    content: ['article']
  }),
  defineArticle({
    id: 'minimax-docs',
    hosts: ['platform.minimaxi.com', 'platform.minimax.cn'],
    content: ['#content'],
    visibleAriaHidden: ['.card-group a[aria-hidden="true"]'],
    path: /^\/docs\//
  }),
  defineArticle({
    id: 'gitee-docs',
    hosts: ['help.gitee.com'],
    content: ['.theme-doc-markdown']
  }),
  defineArticle({
    id: 'gitcode-docs',
    hosts: ['docs.gitcode.com'],
    content: ['.theme-doc-markdown']
  }),
  defineArticle({
    id: 'stepfun',
    hosts: ['stepfun.com'],
    content: ['main']
  }),
  defineArticle({
    id: 'redhat-article',
    hosts: ['redhat.com'],
    content: ['.rhdc-article-body--content']
  }),
  defineArticle({
    id: 'ibm-article',
    hosts: ['ibm.com'],
    content: ['.body-article-8'],
    path: /^\/think\/topics\//
  }),
  defineArticle({
    id: 'jetbrains-docs',
    hosts: ['jetbrains.com'],
    content: ['article .article'],
    ignore: ['.new-feedback']
  }),
  defineArticle({
    id: 'gitlab-docs',
    hosts: ['docs.gitlab.com'],
    content: ['.docs-content']
  }),
  defineArticle({
    id: 'atlassian-support',
    hosts: ['support.atlassian.com'],
    content: ['.topic__body']
  }),
  defineArticle({
    id: 'hashicorp-docs',
    hosts: ['developer.hashicorp.com'],
    content: ['#main']
  }),
  defineArticle({
    id: 'elastic-docs',
    hosts: ['elastic.co'],
    content: ['#markdown-content']
  }),
  defineArticle({
    id: 'prometheus-docs',
    hosts: ['prometheus.io'],
    content: ['.markdown-content']
  }),
  defineArticle({
    id: 'opentelemetry-docs',
    hosts: ['opentelemetry.io'],
    content: ['.td-content']
  }),
  defineArticle({
    id: 'volc-docs',
    hosts: ['docs.volcengine.com'],
    content: ['#doc-viewer-container']
  }),
  defineArticle({
    id: 'digitalocean-tutorial',
    hosts: ['digitalocean.com'],
    content: ['[class*="MarkdownStyles__StyledMarkdown"]'],
    path: /^\/community\/tutorials\//
  }),
  defineArticle({
    id: 'intel-article',
    hosts: ['intel.com'],
    content: ['article.article']
  }),
  defineArticle({
    id: 'nvidia-docs',
    hosts: ['docs.nvidia.com'],
    content: ['article.bd-article']
  }),
  defineArticle({
    id: 'amd-docs',
    hosts: ['rocm.docs.amd.com'],
    content: ['article.bd-article']
  }),
  defineArticle({
    id: 'arm-docs',
    hosts: ['support.arm.com'],
    content: ['.c-dh-content']
  }),
  defineArticle({
    id: 'grafana-docs',
    hosts: ['grafana.com'],
    content: ['#doc-article-text']
  }),
  defineArticle({
    id: 'aws',
    hosts: ['aws.amazon.com'],
    content: ['main']
  }),
  defineArticle({
    id: 'mdn',
    hosts: ['developer.mozilla.org'],
    content: ['.reference-layout__body', '#content', 'main']
  }),
  defineArticle({
    id: 'microsoft-learn',
    hosts: ['learn.microsoft.com'],
    content: ['.content', 'main']
  }),
  defineArticle({
    id: 'apple-support',
    hosts: ['support.apple.com'],
    content: ['.article-content', '#content']
  }),
  defineArticle({
    id: 'google-help',
    hosts: ['support.google.com'],
    content: ['.article-content', 'article']
  }),
  defineArticle({
    id: 'anthropic',
    hosts: ['anthropic.com'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'huggingface-docs',
    hosts: ['huggingface.co'],
    content: ['.prose', 'main']
  }),
  defineArticle({
    id: 'docker',
    hosts: ['docs.docker.com'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'kubernetes',
    hosts: ['kubernetes.io'],
    content: ['.td-content', 'main']
  }),
  defineArticle({
    id: 'postgresql',
    hosts: ['postgresql.org'],
    content: [
      '#docContent',
      '#docContentContainer',
      '#pgContentWrap .sect1',
      '#pgContentWrap .chapter'
    ]
  }),
  defineArticle({
    id: 'mysql',
    hosts: ['dev.mysql.com'],
    content: ['#docs-body']
  }),
  defineArticle({
    id: 'mongodb',
    hosts: ['mongodb.com'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'redis',
    hosts: ['redis.io'],
    content: ['article', 'main']
  }),
  defineArticle({
    id: 'sqlite',
    hosts: ['sqlite.org'],
    content: ['.content', 'body'],
    ignore: ['.nosearch', '.rightsidebar']
  }),
  defineArticle({
    id: 'nginx',
    hosts: ['nginx.org'],
    content: ['#content']
  }),
  defineArticle({
    id: 'apache',
    hosts: ['httpd.apache.org'],
    content: ['#page-content']
  }),
  defineArticle({
    id: 'debian',
    hosts: ['debian.org'],
    content: ['#content']
  }),
  defineArticle({
    id: 'ubuntu',
    hosts: ['ubuntu.com'],
    content: ['article.l-tutorial-section__content', 'main']
  }),
  defineArticle({
    id: 'git',
    hosts: ['git-scm.com'],
    content: ['#main']
  }),
  defineArticle({
    id: 'npm',
    hosts: ['docs.npmjs.com'],
    content: ['[class*="layout-module--Box--"]', 'article', 'main']
  }),
  defineArticle({
    id: 'docusaurus',
    hosts: ['yarnpkg.com', 'prettier.io', 'playwright.dev'],
    content: ['.theme-doc-markdown', 'article']
  }),
  defineArticle({
    id: 'eslint',
    hosts: ['eslint.org'],
    content: ['.docs-main', 'main']
  }),
  defineArticle({
    id: 'selenium',
    hosts: ['selenium.dev'],
    content: ['.td-content', 'main']
  }),
  defineArticle({
    id: 'unity',
    hosts: ['docs.unity3d.com', 'docs.unity.com'],
    content: ['#page-content-container', '.content', 'article']
  }),
  defineArticle({
    id: 'ffmpeg',
    hosts: ['ffmpeg.org'],
    content: ['.page-content', '#content']
  }),
  defineArticle({
    id: 'videolan',
    hosts: ['videolan.org'],
    content: ['main', '#content', '#bodyInner'],
    ignore: ['header', '.navbar', '#header']
  }),
  defineArticle({
    id: 'gimp',
    hosts: ['docs.gimp.org'],
    content: ['.chapter']
  }),
  defineArticle({
    id: 'inkscape',
    hosts: ['inkscape.org'],
    content: ['#content']
  }),
  defineArticle({
    id: 'obs',
    hosts: ['obsproject.com'],
    content: ['.kb_main_content', 'article', '.content']
  })
]
