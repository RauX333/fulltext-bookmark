# Architecture and compatibility

## Module boundaries

| Module | Responsibility |
| --- | --- |
| `capture.ts`, `capture-controller.ts` | Cooperative visible DOM traversal, mutation scheduling, route generations, cumulative visible text, content hashes |
| `adapters.ts`, `weibo.ts` | Site selector priorities and manual Weibo post saving; no server API scraping |
| `database.ts` | Original IndexedDB schema compatibility, atomic writes, incremental index migration, expiration |
| `text.ts`, `identity.ts`, `aliases.ts` | Segmentation, normalization, stop words, stemming, explicit aliases, URL identity, snippets |
| `search.ts`, `ranking.ts` | Indexed candidate retrieval, bounded verification, field weights and proximity ranking |
| `SearchView.tsx`, `Highlight.tsx` | Shared search UI for popup, side panel and tab; original spelling remains visible |
| `SettingsView.tsx`, `settings-ui/*` | Settings orchestration and separate capture/search/data/connection/about sections |
| `settings.ts`, `presentation.ts` | Legacy settings conversion, defaults, toolbar behavior and explicit presentation switches |
| `backup.ts`, `remote.ts` | Import/export/encrypted backups; optional metadata endpoint and synthetic connection test |
| `background.ts`, `search-companion.ts` | Chrome API events, sender validation, bookmarks, history, omnibox and search-engine integration |

Plasmo entrypoints live under `src/`. The original icon and manifest translations remain under root `assets/`, as required by Plasmo. No background keepalive page, remote scripts, eval-based execution or Wasm tokenizer is required. The new runtime dependencies are bundled into the extension. Development uses npm and its single committed lockfile.

## Capture

The controller observes text/child and visibility-affecting attribute changes, frame loads, scrolling, resizing and SPA navigation. Captures coalesce with a 700 ms debounce, at least 2.5 seconds between normal passes, and a 5-second upper scheduling interval on busy pages. DOM traversal yields after approximately 8 ms of work. Generation checks discard results from a route that changed during capture. The background verifies the sender's current document and URL before accepting a snapshot.

Preferred site roots are read before the body fallback. Missing site selectors never cause a page to be discarded. Open shadow roots and same-origin frame documents are included and observed after discovery. Already-seen blocks survive virtualized list removal within the current page session. Inputs, editable fields, extension controls and hidden responsive variants are excluded. A route change starts a new session snapshot; ordinary anchors keep the same page identity. Automatic saves also merge previously captured blocks across visits, so a later partial DOM cannot erase earlier comments.

Changed text is tokenized and written once in an awaited transaction. Identical text avoids reindexing. Long newly captured pages are capped at one million characters, with a visible partial-capture indication. This limit does not apply to original text during migration.

## Search semantics

- ICU `Intl.Segmenter` word boundaries plus CJK unigram/bigram indexing avoid requiring a downloaded model. A longer CJK query can seed from a bigram and is verified against contiguous text, covering context-dependent segmentation.
- `stopword` English/Chinese dictionaries supplement local function-word rules. Negation remains meaningful. Stop words are retained in the index and in quoted queries. An all-stop-word query can still be searched.
- `stemmer` provides English Porter stemming. Exact terms rank above stems, aliases, prefixes and edit-distance-one matches. Typo candidates come from a persisted deletion dictionary. Adjacent letter transpositions are included; Chinese typo/pinyin correction is not claimed.
- OpenCC converts Chinese runs for indexing/search only. Saved text is untouched. Latin accents, width and case normalize; English contractions and dotted initialisms tokenize consistently.
- Explicit alias groups handle examples such as JS/JavaScript, CPU/central processing unit/中央处理器 and U.S.A./USA. Ambiguous initials such as PM are not guessed. Quotes disable alias, prefix and typo expansion and verify the complete phrase.
- The rarest term seeds candidate retrieval. All terms are checked against each candidate's complete token lists, fixing the false negative caused by intersecting separately truncated common-word lists. Work is capped at 5,000 candidates and the UI asks for more specific keywords when capped; this is not an unlimited exact total.
- Ranking combines field weights (title 5, body 1, URL 2), an approximate inverse document frequency, saturated occurrence counts and the shortest window containing matched terms. Whole-title/phrase matches are boosted, very long documents are lightly penalized, and recency contributes only a small tie-breaker. This is a documented heuristic, not a claimed semantic or neural model.
- If a query of at least three terms has no complete match, a clearly labeled fallback requires at least two terms and 60% coverage. It does not discard negation or relax quotes. Snippets are built for the requested result page only. Full bodies are read in bounded batches, rather than loaded for the entire archive.

## Upgrade contract

The extension retains `PageDatabase` and the v1 `pages`, `contents`, `vectors` stores. The v2 schema adds URL/index metadata and a persistent token dictionary. Legacy primary keys, duplicate URLs, unsupported legacy URLs, timestamps, full original text and bookmark flags remain intact; unsupported URLs cannot become executable search links. Old optional auxiliary rows are preserved during migration, without retaining their former integration code.

`indexVersion` is separate from the IndexedDB schema version. Current token format is 3. Batches of 25 records commit independently, and alarms resume interrupted work. The original `persist:fulltextbookmark` key remains untouched; JSON-stringified Redux fields are converted to `settings.v2`, including false booleans and zero retention. Index construction never requests an export/import. Expiration pauses for 24 hours after the original-schema upgrade, then resumes the existing retention rule.

Settings preserved: `storeEveryPage`, `bookmarkAdaption`, `weiboSupport`, `searchEngineAdaption`, `showOnlyBookmarkedResults`, `tempPageExpireTime`, `maxResults`, `forbiddenURLs`, `remoteStore`, `remoteStoreURL`, `remoteStoreKey`, `remoteStoreEveryPage`. Address-bar search keeps `kw`, with a new explicit enable setting. About/contact/donation links remain available. Removed AI settings are ignored. New language, fuzzy matching and default presentation preferences use compatible defaults.

The default icon action opens the side panel. Users can select popup or search tab in Settings. Explicit switching carries the query without changing that preference. Popup geometry uses screen bounds, not its initially small `100vw/100vh`, to guarantee the requested 400 × 600 size on a sufficiently large display. A missing side-panel API falls back to popup. Minimum supported Chrome is 127 for general availability of programmatic popup opening.

## Dependencies and build constraints

Direct packages were checked against npm latest on 2026-11-08. Supported transitive fixes are pinned via npm overrides. `npm audit --omit=dev` reports zero runtime vulnerabilities. The Plasmo 0.90.5 build chain still pins Parcel 2.9.3; seven low/moderate development-only audit findings remain. Forcing its reporter to Parcel 2.16.4 produces plugin compatibility errors, so that incompatible override is not shipped. No such reporter code is part of the production extension. `npm audit fix --force` proposes a much older Plasmo release and is not an acceptable upgrade.

## References

- [Chrome service-worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Chrome extension security migration](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security)
- [Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [Action popup size and behavior](https://developer.chrome.com/docs/extensions/reference/api/action)
- [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Plasmo extension entrypoints](https://docs.plasmo.com/framework/ext-pages)
