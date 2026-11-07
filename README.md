# Fulltext Bookmark · 全文书签

[Chrome 应用商店](https://chromewebstore.google.com/detail/fulltext-bookmark/nemjnpfmngeipdjjjecgjgeognbcmkbl) · [English](README.en.md)

可以全文搜索的书签和历史记录。全部保存在本地。随时搜索。

hey, 好久不见，现在带来一大波改进。

## 2.0 的改进

- 可见 DOM 提取、站点正文优先级、同源 iframe 和开放 Shadow DOM；动态评论、展开正文、SPA 路由和虚拟滚动追加保存。过滤隐藏的响应式副本、输入框与编辑区域。后台以完整事务确认保存，不再因 pageId 相同而漏掉更新。
- 微博新版时间链接、作者、正文及转发正文适配。每次点击重新读取当前卡片，避免虚拟列表复用时保存错帖；每个状态都保留原冰山图标。长微博请先展开再保存，可再次点击更新。
- 中英文分词、停用词、英文词形与单字符拼写模糊匹配、尾词前缀、简繁匹配、常见缩写和缩约形式。双引号内按完整短语验证；否定词保留。
- 排序结合标题权重、词语稀有程度、完整短语、词频饱和度和关键词距离；日期只作轻微辅助。无完整匹配时，三个及以上关键词可回退到多数词匹配，界面明确提示；不会丢弃否定词或放宽引号内短语。
- 搜索摘要、高亮、字段筛选、书签筛选、打开的标签页搜索/切换。真实工具栏 popup 为 400 × 600（小屏幕受可用尺寸限制），并提供“在标签页中搜索”。
- 所有界面支持简体中文 / English。设置保留保存开关、书签同步、微博、搜索引擎结果、地址栏搜索、保留天数、结果数量、排除规则、自定义 API、数据管理和关于/捐赠。自定义 API 有测试连接按钮，测试只发送示例元信息。
- 移除 AI 接入。支持原 JSON / CSV 备份、标准多行 CSV 和可选密码加密备份。密码仅用于备份文件，不是扩展数据库加密。

## 已有用户升级

**通过原商店条目升级即可直接使用旧数据，不需要导出或导入。**

## 开发、构建和测试

需要 Node.js 22.12+（推荐 24 LTS）和已安装的 Google Chrome。使用 Plasmo / Manifest V3。

```sh
npm ci
npm run dev
npm run check
npm run test:e2e
npm run package
```

生产目录：`build/chrome-mv3-prod`。在 `chrome://extensions` 开启开发者模式，加载此目录。`npm run package` 生成用于商店上传的 zip。测试使用隔离 Chrome 配置，不读取日常浏览器资料；其中工具栏 popup 用有界面的 Chrome 实测。

```sh
npm run benchmark
npm run benchmark:chrome
```

基准数据、浏览器截图和测试结果位于忽略提交的 `artifacts/`、`test-results/`、`playwright-report/`。基准使用合成网页，不代表所有设备或网站表现。架构、兼容性和测试范围见 [维护说明](docs/architecture.md) 和 [验证记录](docs/validation.md)。

## 保存范围

扩展只保存浏览器已经加载的文字，不主动操作网页，也不会绕过登录、付费或跨域限制。没有实际加载的评论/长文、跨域 iframe、关闭的 Shadow DOM、图片文字和浏览器 PDF 内部视图不能保证抓取。历史记录导入只能取得浏览器已有的标题、网址和访问时间，重新访问后才会补充正文。单页最多保存 100 万字符，超过时结果显示部分保存；迁移过程不截断旧原文。

站点规则参考了 [Omnivore 的内容处理器结构](https://github.com/omnivore-app/omnivore/tree/main/packages/content/content-handler/src/websites)，实现使用独立的可见 DOM 选择规则，没有复制其 AGPL 源码。依赖许可证见 [第三方说明](docs/third-party.md)。
