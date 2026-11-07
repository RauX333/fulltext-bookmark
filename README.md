# Fulltext Bookmark · 全文书签

[Chrome 应用商店](https://chromewebstore.google.com/detail/fulltext-bookmark/nemjnpfmngeipdjjjecgjgeognbcmkbl) · [English](README.en.md)

可以全文搜索的书签和历史记录。全部保存在本地。随时搜索。

Hey，好久不见！这次带来了一大波改进。

## 2.0 的改进

- 改进网页文字抓取机制。
- 微博保存功能适配新版微博。
- 优化搜索，更准确地找到需要的内容。
- 支持侧边栏搜索和新标签页搜索。
- 支持加密导出备份。
- 适配小屏幕设备。
- 多项界面与功能改进，以及 bug 修复。

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

性能测试：

```sh
npm run benchmark
npm run benchmark:chrome
```
