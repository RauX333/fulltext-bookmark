# Chrome Web Store materials · 2.0.2

2.0.2 上传包为 `build/Fulltext-Bookmark-2.0.2-chrome.zip`，包根目录直接包含 `manifest.json`。此版本增加正文站点适配、可扩展的 adapter 结构、对话保存和文字预览/导出等改进；权限范围保持不变。在原商店条目上传此 ZIP 即可保留扩展身份和已有数据。

运行 `npm run package` 构建并打包，同时生成 `.sha256` 校验文件。打包器使用 Node zlib 压缩，并在写出前解压、逐字节核对全部构建文件，避免旧打包路径曾出现的损坏压缩流。ZIP 仅包含可安装的扩展；商店截图及宣传图在本目录中单独上传。

此前的 400 个站点样本网络复测记录已保留。最终 2.0.2 按用户要求运行常规回归测试，不再重跑 400 站网络复测。类型检查、55 项单元测试、59 项 Chrome 测试全部通过，覆盖正文抓取、搜索、保存预览、导出、备份恢复及旧版数据原位升级。

2.0.1 已移除多余的 `tabs` 权限，保留 HTTP/HTTPS 站点权限以支持网页全文保存和已打开标签页搜索；下列权限说明和截图继续适用。

构建后还会清理 Plasmo 为内嵌微博图标生成的多余 PNG 资源声明，避免 manifest 引用不存在的文件；实际图标继续内嵌在内容脚本中。

## 2.0.1 权限核查

| 权限 | 当前用途及结论 |
| --- | --- |
| `tabs` | 已移除。标签页搜索只处理 HTTP/HTTPS 页面，已有站点权限覆盖其标题、URL 读取；创建、切换标签页不需要此权限。 |
| `storage` | 保留。`src/settings.ts` 保存设置，`src/SearchView.tsx` 使用 session storage 传递侧边栏查询词。 |
| `bookmarks` | 保留。`src/background.ts` 查询书签状态、同步现有书签，并监听新增、修改和删除。当前每次抓取也会查询书签状态，不能只删除声明。 |
| `alarms` | 保留。`src/background.ts` 定时清理过期内容，并分批恢复索引重建。 |
| `webNavigation` | 保留。`src/background.ts` 校验抓取消息对应的当前文档，并监听单页应用路由和 hash 变化。 |
| `unlimitedStorage` | 建议保留。正文及全文索引存储在 IndexedDB；此声明直接提供存储配额和自动驱逐豁免，不需要对应的 API 调用。取消后小数据量仍可工作，但要设计容量限制、配额错误处理及持久存储策略。 |
| `sidePanel` | 保留。侧边栏是默认搜索入口，`src/presentation.ts` 和 `src/SearchView.tsx` 调用侧边栏 API。 |
| `history`（可选） | 保留可选声明。只在用户点击“导入浏览历史”时申请，后台确认授权后读取历史。 |
| `http://*/*`、`https://*/*` | 保留当前站点范围。自动全文保存覆盖任意网页，标签页标题/URL 查询及用户配置的远程 API 请求也使用此范围。缩小为按站点授权需要同步调整功能与授权流程。 |

若将书签集成改为用户主动开启，可将 `bookmarks` 改为可选权限，同时为所有相关 API 调用与监听器补充未授权处理。当前默认启用书签集成，因此 2.0.1 保持现有功能，只移除确定冗余的 `tabs`。

依据：[Chrome 权限列表](https://developer.chrome.com/docs/extensions/reference/permissions-list)、[存储配额与持久性](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies)、[可选权限](https://developer.chrome.com/docs/extensions/reference/api/permissions)、[多余权限审核说明](https://developer.chrome.com/docs/webstore/troubleshooting#excessive-permissions)。

## 商店素材

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
