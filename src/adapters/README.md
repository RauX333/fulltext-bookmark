# Rendered-content adapters

Adapters select text already rendered in a page. They do not download articles or bypass access controls.

## Layout

- `types.ts`: the contract shared by capture and site rules.
- `define.ts`: `defineArticle` for isolated articles; `defineAdapter` for multiple roots and application views.
- `registry.ts`: explicit registration and deterministic host/path matching.
- `roots.ts`: DOM root discovery, visibility, shadow roots and page titles.
- `noise.ts`: shared structural exclusions, never keyword-based deletion of article prose.
- `sites/`: rules grouped by subject or platform, independent of audit batches.
- `shared/`: observed layout components reused by related publishers, such as Hearst signup and recommendation widgets.

## Add a site

Add a definition to the appropriate module in `sites/`. A new subject can have its own module, imported once in `registry.ts`.

```ts
defineArticle({
  id: 'example-article',
  hosts: ['example.com'],
  path: /^\/articles\//,
  content: ['.article-body', 'article'],
  ignore: ['.related-stories']
})
```

Use selectors observed on a real article. `content` is an ordered fallback list for articles; the first selector with visible matches wins. All its matches are retained, which supports split article sections. `defineAdapter` can instead combine several selectors for questions, answers and comments. Isolated rules wait for their article root rather than capturing the page shell.

For an infinite-scroll publisher that appends separate articles, use `maxRoots: 1` after verifying that its first matching root contains the entire current article. Keep multiple roots for split article sections and recipe ingredients/steps.

If scrolling also changes the URL, set `rootIdentity` to the observed descendant attribute and a pathname pattern whose first capture group is the article ID. Selection then follows the current article instead of silently using the first DOM article. Static Media's shared rule covers this structure; its regression checks all sections and both saved URLs.

Prefer `ignore` selectors for ads, recommendations and author widgets. A publisher sometimes places a terminal recommendation heading or a promotion in an ordinary paragraph with no distinct container. `stopBefore: [{selector, text: RegExp}]` stops at an observed terminal marker; `excludeBlocks` skips only the matching block. These are host-scoped rules for exact boilerplate, not general word filters. Verify the final real body paragraph and recipe notes/nutrition before adding a boundary. Hidden markers are ignored. Add a regression proving that legitimate prose containing the same words remains intact.

Rules match a hostname or its subdomains, with label boundaries. Explicit `priority` wins first, then the most specific matching host, then a path-specific rule. Avoid ambiguous equal-precedence rules.

Keep `id` stable across file moves: it is part of saved-content identity. Increment a rule's `revision` when a change must replace previously saved noise; revision defaults to `2` for existing rules. This avoids invalidating all other sites when changing one adapter.

Record live evidence in the audit corpus/report, not in a chronological production filename. Verify real body paragraphs, absence of external UI/ads, content search, saved-text preview and persistence after browser restart. Add a focused regression when a new DOM structure or capture behavior needs protection. Access-blocked pages belong in `capture-policy.ts`; do not create guessed article selectors for them.
