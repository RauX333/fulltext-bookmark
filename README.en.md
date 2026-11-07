# Fulltext Bookmark

[Chrome Web Store](https://chromewebstore.google.com/detail/fulltext-bookmark/nemjnpfmngeipdjjjecgjgeognbcmkbl) · [中文](README.md)

Archive the loaded text of pages you visit and search it later. Keeps the original iceberg icon, popup, white/blue interface, and `kw + Tab` omnibox search. The toolbar opens a side panel by default. Settings can change it to a 400 × 600 popup or a search tab, and explicit switches carry the current query. Field filters, snippets and open-tab switching are available.

Version 2 adds visible DOM capture for dynamic pages, expanded Weibo posts and forwarded text, same-origin frames, open shadow roots, SPA navigation and virtualized lists. Hidden responsive copies and form/editable fields are excluded. Search supports Chinese segmentation, traditional/simplified forms, English stemming, stop words, prefix/typo matching, contractions and conservative abbreviation aliases. Quoted phrases remain exact; negation is retained. Ranking favors title and coherent phrase matches over scattered repetition. Every screen supports English and Simplified Chinese.

Existing store users upgrade in place: the original database, primary keys, saved text, timestamps, bookmarks and settings are preserved. Background indexing resumes after suspension; no export/import is required. Automatic expiration pauses for the first day after upgrading, then resumes the existing retention rule. Keep the existing extension ID/store listing. An unpacked development install has separate storage.

## Build and verify

Node.js 22.12+ (24 LTS recommended), npm, and installed Google Chrome are required.

```sh
npm ci
npm run dev
npm run check
npm run test:e2e
npm run package
npm run benchmark:chrome
```

Load `build/chrome-mv3-prod` using Chrome's developer mode. Plasmo builds the Manifest V3 extension and package. Tests use isolated Chrome profiles, including a real headed toolbar popup. See [architecture](docs/architecture.md), [validation](docs/validation.md) and [third-party notices](docs/third-party.md).

All original settings except the removed AI integration remain available. Optional custom API metadata delivery includes a synthetic connection test. JSON, legacy backups, multiline CSV and optional password-encrypted backup files are supported. Backup encryption does not encrypt the live extension database.

Only already-loaded text can be captured. The extension does not click through pages or bypass login/paywalls. Cross-origin frames, closed shadow roots, image text and browser-internal PDF viewers are unsupported. Importing preexisting history provides titles/URLs only; revisit pages to capture text. New captures are capped at one million characters and labeled when truncated. Legacy text is never truncated by migration.
