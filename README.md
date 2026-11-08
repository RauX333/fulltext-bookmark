# Fulltext Bookmark

[Chrome Web Store](https://chromewebstore.google.com/detail/fulltext-bookmark/nemjnpfmngeipdjjjecgjgeognbcmkbl) · [简体中文](README.zh-CN.md)

Full-text search for your bookmarks and browsing history. Everything is stored locally. Search anytime.

Hey, it's been a while! This update brings a whole batch of improvements.

## What's new in 2.0

- Improved webpage text capture, with broader site support and less page clutter.
- Save ChatGPT, Gemini and DeepSeek messages and conversations.
- Save Weibo and X (Twitter) posts, with optional automatic capture.
- Search more accurately with phrases, wildcards, site filters and built-in search help.
- Preview saved text as Markdown and export individual items to Markdown or PDF.
- Search in the side panel or a new tab.
- Settings save automatically with input validation; new installations exclude common webmail sites from automatic capture.
- Export encrypted backups and keep existing data when upgrading.
- Reduced extension permissions, better support for small screens, and various fixes.

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
