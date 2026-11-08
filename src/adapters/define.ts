import type { SiteAdapter } from './types'

/** A rendered article has ordered fallback selectors and never falls back to the whole page. */
export function defineArticle(
  options: Omit<SiteAdapter, 'isolate' | 'firstMatch'>
): SiteAdapter {
  return { isolate: true, firstMatch: true, ...options }
}

/** Discussions and application views may combine several independent content roots. */
export function defineAdapter(options: SiteAdapter): SiteAdapter {
  return options
}
