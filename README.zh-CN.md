# Fulltext Bookmark · 全文书签

[Chrome 应用商店](https://chromewebstore.google.com/detail/fulltext-bookmark/nemjnpfmngeipdjjjecgjgeognbcmkbl) · [English](README.md)

可以全文搜索的书签和历史记录。全部保存在本地。随时搜索。

Hey，好久不见！这次带来了一大波改进。

## 2.0 的改进

- 改进网页正文抓取，支持更多网站并减少页面杂项。
- 支持保存 ChatGPT、Gemini 和 DeepSeek 单条消息及对话。
- 支持保存微博和 X（Twitter）帖子，可选择自动保存。
- 优化搜索，支持精确短语、通配符、站点筛选和内置搜索帮助。
- 支持以 Markdown 预览保存的文字，并将单篇导出为 Markdown 或 PDF。
- 支持侧边栏搜索和新标签页搜索。
- 设置自动保存并校验输入；新安装默认不自动保存常见网页邮箱。
- 支持加密导出备份，升级时保留已有数据。
- 减少扩展权限，改进小屏幕适配，并修复多项问题。

## 导出单篇文字

“查看保存的文字”弹窗顶部提供“Markdown 格式显示”按钮，点击后按 Markdown 渲染，再点击“原文显示”即可还原。普通文章和 ChatGPT 对话气泡均支持。支持 ChatGPT 常用的标题、加粗/斜体、引用、嵌套列表、表格、任务列表、删除线、链接、图片、代码块高亮，以及 `$…$` / `$$…$$` 和 `\(…\)` / `\[…\]` 数学公式。每次打开默认显示原文；切换不修改保存内容或导出内容。原始 HTML 按文字显示。仅有纯文本、没有保留下来的 Markdown 标记无法还原格式。

搜索结果中点击“查看保存的文字”，再点击“导出”，可以下载 Markdown（`.md`）文件，或选择 PDF，在 Chrome 打印窗口中选择“另存为 PDF”。导出包含标题、原网址和已保存正文；支持中文和长文分页。没有已保存正文的条目不可导出。

Markdown 文件开头包含 YAML 元数据区，PDF 正文前包含同样的元数据表：`title`、`url`、`saved_at`、`exported_at`、`source`、`is_bookmarked`、`truncated`。时间使用 ISO 8601 UTC 格式（以 `Z` 结尾）。`saved_at` 沿用记录已有的最近保存/访问时间，导入记录保留原时间，并非首次保存时间；`exported_at` 是本次导出的时间。未知的时间或来源在 Markdown 中记为 `null`，在 PDF 中显示为“未知”。

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

生产目录：`build/chrome-mv3-prod`。在 `chrome://extensions` 开启开发者模式，加载此目录。`npm run package` 生成用于商店上传的 ZIP 安装包。

更新或重新加载扩展后，请刷新之前已打开的网页，让保存按钮和自动抓取使用新版脚本。旧版页面可能留下 `Extension context invalidated` 错误记录；新版会在发现失效后停止旧脚本并移除旧按钮。已有保存数据不受影响；历史错误可在扩展的“错误”页面清除。

性能测试：

```sh
npm run benchmark
npm run benchmark:chrome
```
