# User handbook

Fulltext Bookmark saves the text loaded in pages you browse and makes it searchable later. The toolbar icon opens the side panel by default. In **Settings → Search → Clicking the extension icon opens**, choose side panel, popup or search tab. Switching views from the search header carries your query and does not change this default. The toolbar popup is 400 × 600 CSS pixels on a sufficiently large screen.

## Search

Type keywords in the search box, or enter `kw` and press Tab in Chrome's address bar. Use the title/text/URL field selector, bookmark filter and date/relevance sort. Double quotes require a complete phrase. English typo matching is optional; stemming, Chinese segmentation, simplified/traditional forms and supported abbreviation aliases work automatically. Negation is preserved. When only a majority of query terms match, the results explicitly say so.

Results show matching snippets. **Read saved text** opens the archived text. **Open tabs** searches titles/URLs of tabs you currently have open and can switch directly to them. Existing browser-history imports do not contain page bodies; visit those pages to add text.

## Capture and Weibo

Capture includes loaded comments, expanded text, responsive content and virtualized lists you scroll through. Hidden content and form inputs are excluded. For long Weibo posts, expand the post first and click the original iceberg save button. Saved posts can be updated by clicking again. Forwarded post text is included when loaded. The button does not like, post, or otherwise change your Weibo account.

## Settings and backups

Capture settings control automatic saving, bookmark synchronization, Weibo buttons, retention days (0 = forever) and URL exclusions. Search settings include language, default view, page size, bookmarks-only default, fuzzy matching, search-engine integration and omnibox search.

JSON and CSV exports include saved text. Imports merge records while retaining newer existing text. Optional encrypted backups require a password of at least eight characters; the password is not saved, and this encrypts the backup file only. The optional custom API sends page metadata to the address you configure. **Test connection** sends one synthetic record without history or page text.

Existing users of the original store listing upgrade directly with their saved records and settings. The background index may need time to update; an in-progress message appears. See [compatibility details](architecture.md#upgrade-contract). The developer unpacked build has a different extension ID and separate data.

[中文使用说明](../README.zh-CN.md) · [Build and development](../README.md)
