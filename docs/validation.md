# Validation record — 2026-11-08

Environment: Windows, Node.js 24.15.0, installed Google Chrome 156.0.8078.80, Plasmo 0.90.5, Manifest V3. Chrome tests use temporary isolated profiles except the explicitly authorized logged-in Weibo check.

## Automated coverage

- 18 Node test cases: legacy Redux settings, zero retention, URL normalization/security, same-page updates, atomic concurrent upserts, bilingual search, ranking, fuzzy matching, phrase filters, v1 data migration, expiry cleanup, multiline CSV, legacy backup merge, authenticated encrypted backups, malformed URL encoding and synthetic API connection tests.
- A separate 13-query relevance corpus checks first-result expectations for Chinese/English stop words, traditional/simplified Chinese, aliases, dotted initialisms, contractions, phrase proximity and bounded partial matching. It also rejects ambiguous acronym guesses and preserves negation. This is a regression corpus, not a general benchmark of all real-world queries.
- The common-posting regression has 5,005 records and places a rare correct match after the former 5,000-posting cutoff.
- 11 browser cases exercise dynamic comments, responsive hidden copies, forms/editable fields, open shadow DOM, same-origin frames, virtualized text retention, SPA identity, IME completion, empty results, snippets, tab switching, worker suspension, Weibo expanded/forwarded/recycled cards, bilingual settings, backup downloads/restoration and viewport widths 360/390/768/1280.
- Real headed Chrome toolbar popup: measured `innerWidth=400`, `innerHeight=600`; arrow pagination is present. Side panel, popup and tab preference changes take effect immediately. Explicit mode changes carry the query while preserving the default preference.
- Actual same-ID Chrome upgrade: seeded the original native IDB v10 (Dexie v1), installed the new build at the same unpacked path, then searched original records without an import. IDs 42/43, timestamps, text, saved flags and original Redux preferences survived. An expired legacy non-bookmark remained after upgrade under the migration grace period.
- Original Weibo icon pixels are compared against `assets/icon512.png`, allowing lossless PNG re-encoding by the build tool.

Commands: `npm run check`, `npm run format:check`, `npm run test:e2e`, `npm run package`, `npm audit --omit=dev`. Generated evidence remains under `test-results/` and `playwright-report/`, not in the repository. The production zip contains third-party license notices.

## Actual backup export/import check

A separate visible Chrome window uses an isolated profile and synthetic records. The test operates the settings UI: import two initial records, click each export button, verify the actual file on disk, clear only this test database, select the exported file for import, and search for both restored records in the search UI. JSON, CSV and password-encrypted JSON all preserve titles, complete multiline text, Chinese, emoji, commas/quotes, formula-like text, timestamps and bookmark flags. Wrong-password and tampered encrypted-file imports report an error and leave the existing records unchanged.

Export filenames use local date/time, for example `Fulltext-Bookmark-2026-11-08_00-34-33.encrypted.json`. The browser test explicitly uses ordinary download naming instead of Playwright's internal GUID artifact naming and verifies the actual on-disk filename. The authorized daily Chrome debugging session has also had its normal download behavior restored. This test never clears the daily browser database. Evidence: `test-results/evidence/backup-downloads/results.json` and `backup-restored-*.png`.

## Authorized live Weibo check

Connected to the user's running Chrome through its explicitly enabled remote debugging endpoint. No passwords or cookies were read. Verified current article cards, hashed timestamp/author classes, `.wbpro-feed-content`, forwarded `.wbpro-feed-reText`, and expansion controls. Eight visible save controls all loaded the original iceberg icon. After expanding a forwarded long post and saving again, 1,914 characters were stored, including the full 1,841-character forwarded passage and its ending. The permalink was searchable as a saved bookmark. Only local save controls were clicked; no posts, likes or account changes were made. Personal page content/screenshots are not committed.

## Synthetic performance sample

`npm run benchmark:chrome` uses the installed Chrome with real IndexedDB, 3,000 synthetic pages (~2.5 KB each), 20 repeated search samples and 10 capture samples. Timings include local database work, not network page loading or the deliberate capture debounce.

| Operation | Median | p95 |
| --- | ---: | ---: |
| Save and index one page | 5.5 ms | 7.6 ms |
| Chinese selective query | 13.3 ms | 24.1 ms |
| English selective query | 15.7 ms | 22.2 ms |
| English typo query | 18.1 ms | 24.5 ms |
| Common query matching all 3,000 pages | 820.9 ms | 931.7 ms |
| Extract 218,669 visible characters | 45.7 ms | 108.7 ms |

Common queries remain more expensive because ranking must inspect many candidates. The UI debounces typing, ignores obsolete responses, and the worker abandons superseded searches between batches. Candidate memory is bounded and snippets are created only for displayed results. These figures are specific to this synthetic corpus and machine; a percentage improvement over the original release is not claimed because no equivalent original-release benchmark was recorded.

## Boundaries

Real live-site verification was performed on Weibo; other site-specific selectors are maintained fallback rules, not a claim that every current page on each site was manually tested. Cross-origin frames, closed shadow roots, unloaded content, image OCR and browser PDF internals remain outside capture coverage. Seven low/moderate development-toolchain audit findings remain in Plasmo's pinned Parcel stack; runtime dependency audit is clean. See [architecture](architecture.md) for the compatible upgrade choices.
