# Third-party software and implementation references

The lockfile pins exact installed packages. Runtime dependencies:

| Package | License | Purpose |
| --- | --- | --- |
| Dexie | Apache-2.0 | IndexedDB transactions and schema upgrades |
| React / React DOM | MIT | Shared extension UI |
| Papa Parse | MIT | Correct multiline CSV parsing/export |
| stemmer | MIT | English stemming |
| stopword | MIT | English/Chinese stop-word dictionaries |
| opencc-js | MIT AND Apache-2.0 | Traditional/simplified Chinese search normalization |

OpenCC's distributed `LICENSE`, `LICENSES/Apache-2.0.txt` and `THIRD_PARTY_LICENSES.md` contain the converter/data attributions. Package license files are copied into the distribution by `scripts/license-notices.mjs` after the Plasmo build.

[Omnivore](https://github.com/omnivore-app/omnivore) (AGPL-3.0) and [Mozilla Readability](https://github.com/mozilla/readability) (Apache-2.0) were reviewed as capture references. No source from either was copied. Our small site rules select already-rendered DOM and retain a body fallback, including comments and app content that article-only extraction can omit.
