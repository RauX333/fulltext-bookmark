export interface SiteAdapter {
  /** Stable persistence identity. Never rename merely to reorganize files. */
  id: string
  /** Increment when this rule changes the meaning of saved text. */
  revision?: number
  /** Resolves intentionally overlapping rules; higher wins. */
  priority?: number
  hosts: string[]
  content: string[]
  title?: string[]
  isolate?: boolean
  firstMatch?: boolean
  /** Limit roots for publishers that append unrelated articles on scroll. */
  maxRoots?: number
  /** Match a rendered article's identity to capture group 1 of the current path. */
  rootIdentity?: { selector: string; attribute: string; path: RegExp }
  /** Observed terminal recommendation/promotion headings in the article body. */
  stopBefore?: { selector: string; text: RegExp }[]
  /** Exact publisher boilerplate blocks without a distinct CSS container. */
  excludeBlocks?: { selector: string; text: RegExp }[]
  ignore?: string[]
  shadow?: boolean
  path?: RegExp
  // Some article cards mark visually rendered link wrappers aria-hidden.
  visibleAriaHidden?: string[]
}
