# Fulltext Bookmark

[Chrome Web Store](https://chromewebstore.google.com/detail/fulltext-bookmark/nemjnpfmngeipdjjjecgjgeognbcmkbl) · [简体中文](README.zh-CN.md)

Full-text search for your bookmarks and browsing history. Everything is stored locally. Search anytime.

Hey, it's been a while! This update brings a whole batch of improvements.

## What's new in 2.0

- Improved webpage text capture.
- Updated Weibo saving support for the latest Weibo interface.
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

Performance tests:

```sh
npm run benchmark
npm run benchmark:chrome
```
