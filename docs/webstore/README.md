# Chrome Web Store materials · 2.0.0

- 中文说明：`description.zh-CN.txt`
- English description: `description.en.txt`
- 中文截图：`screenshots/zh-CN/`
- English/global screenshots: `screenshots/en/`

每组 5 张，全部为 1280 × 800 JPEG，可按文件名前缀顺序上传。中文资源使用中文组，英文或全球通用资源使用英文组。ZIP 是交付用压缩包，截图需解压后逐张上传。

| 文件                   | 展示功能                              |
| ---------------------- | ------------------------------------- |
| 01-fulltext-search.jpg | 全文搜索、短语匹配、摘要与高亮        |
| 02-saved-text.jpg      | 查看已保存的网页文字                  |
| 03-search-engine.jpg   | 中文百度 / 英文 Bing 的已保存页面匹配 |
| 04-open-tabs.jpg       | 搜索并切换已打开标签页                |
| 05-backup-settings.jpg | JSON、CSV、密码加密备份及导入入口     |

截图来自独立的临时 Chrome 配置，仅浏览中英文 Wikipedia 的太阳系、行星和火星文章，以及公开搜索结果。未连接日常 Chrome 配置、账号、个人书签或历史数据。截图直接捕获页面内容，不包含书签栏、地址栏、操作系统桌面或其他窗口，也未合成或改写网页内容。Google 搜索在本次环境触发验证码，因此未采用其截图。

来源清单见 `screenshots/sources.json`。Wikipedia 正文及搜索结果属于对应第三方，这里仅展示扩展的实际使用场景。

重新拍摄：先构建生产版，再从项目根目录运行 `node scripts/capture-store-screenshots.mjs`。脚本使用新的临时配置，不复用个人 Chrome 资料。公开网站的布局、内容和网络访问可能变化，因此重新生成后仍需逐张检查。

尺寸和展示要求参考 [Chrome Web Store 官方截图说明](https://developer.chrome.com/docs/webstore/images)。
