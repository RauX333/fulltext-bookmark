# Fulltext Bookmark

[Chrome Web Store](https://chromewebstore.google.com/detail/fulltext-bookmark/nemjnpfmngeipdjjjecgjgeognbcmkbl) · [简体中文](README.zh-CN.md)

Full-text search for your bookmarks and browsing history. Everything is stored locally. Search anytime.

Hey, it's been a while! This update brings a whole batch of improvements.

## What's new in 2.0

- Improved webpage text capture.
- A second live audit covers 50 new Chinese and 50 new international sites, with dedicated article adapters and fixes for repeated table values and missing content cards.
- Further audits cover 100 non-IT sites and 100 traffic-ranked blog candidates, with source-backed ranking methodology. Adapters now have a reusable [domain and shared-component structure](src/adapters/README.md).
- The initial exclusion list now includes common webmail sites (Gmail, Outlook, QQ/Tencent business mail, NetEase, iCloud Mail and more) to avoid automatically saving email. Rules are editable; upgrades preserve existing lists, so existing users can add these exclusions themselves.
- ChatGPT, Gemini and DeepSeek message and conversation saving, enabled by default. Save icons follow each native message action row; the conversation icon sits outside the composer, and saved text has a green check. Automatic saving waits for responses to finish; saved messages are grouped into a conversation with chat bubbles in search previews. Both features can be switched off in Settings.
- Updated Weibo saving support for the latest Weibo interface.
- X (Twitter) post saving. Weibo and X default to saving text only when you click **Save post**; each site has separate automatic capture and enable settings.
- Settings save automatically, with validation alerts that preserve your last valid settings.
- More accurate search to help you find what you need.
- Side panel and new-tab search.
- Encrypted backup exports.
- Better support for smaller screens.
- Many interface and feature improvements, plus bug fixes.

## Upgrading from an earlier version

**Update through the original Chrome Web Store listing to keep using your existing data. No export or import is needed.**

## Development, builds and tests

Requires Node.js 22.12+ (24 LTS recommended) and Google Chrome. Built with Plasmo and Manifest V3.

```sh
npm ci
npm run dev
npm run check
npm run test:e2e
npm run package
```

Production output: `build/chrome-mv3-prod`. Enable developer mode at `chrome://extensions` and load this directory. `npm run package` creates a ZIP package for Chrome Web Store submission.

After updating or reloading the extension, refresh already-open webpages to activate the new capture script and save buttons. Old versions may leave `Extension context invalidated` error records; the current version stops stale scripts and removes their controls when invalidation is detected. Saved data is retained. Historical errors can be cleared from the extension's Errors page.

Performance tests:

```sh
npm run benchmark
npm run benchmark:chrome
```
