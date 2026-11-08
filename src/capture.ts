import { preferredRoots, selectAdapter, articleNoise } from './adapters'
import { isCaptureInterstitial } from './capture-policy'
import { mergeArticleSnapshot } from './captured-snapshot'
export const MAX_CAPTURE_LENGTH = 1_000_000
const skipTags = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'SVG',
  'CANVAS',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'OPTION',
  'BUTTON'
])
const blockTags = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'BR',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TD',
  'TH',
  'TR',
  'UL'
])
export interface Capture {
  text: string
  truncated: boolean
  roots: (Document | ShadowRoot)[]
  nodes: number
  profile?: string
}
export function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function')
      requestIdleCallback(() => resolve(), { timeout: 500 })
    else setTimeout(resolve, 0)
  })
}
// Traverse the rendered DOM, not a cloned article: discussions, app views and expanded
// text are first-class content. Yield frequently to preserve scrolling and typing.
export async function extractVisibleText(
  root: Document | Element,
  cancelled = () => false,
  ignoreSelector?: string
): Promise<Capture> {
  const document =
    root.nodeType === 9 ? (root as Document) : root.ownerDocument!
  if (root.nodeType === 9 && isCaptureInterstitial(document))
    return { text: '', truncated: false, roots: [document], nodes: 0 }
  if (root.nodeType === 1 && hiddenAncestor(root as Element))
    return { text: '', truncated: false, roots: [document], nodes: 0 }
  const preferred =
    root.nodeType === 9
      ? preferredRoots(document, document.location?.hostname || '')
      : []
  const adapter =
    root.nodeType === 9
      ? selectAdapter(
          document.location?.hostname || '',
          document.location?.pathname
        )
      : undefined
  const isolated = !!adapter?.isolate
  const stops = (isolated ? adapter?.stopBefore || [] : []).map((rule) => ({
    selector: rule.selector,
    text: new RegExp(rule.text.source, rule.text.flags.replace(/[gy]/g, ''))
  }))
  const excludedBlocks = (isolated ? adapter?.excludeBlocks || [] : []).map(
    (rule) => ({
      selector: rule.selector,
      text: new RegExp(rule.text.source, rule.text.flags.replace(/[gy]/g, ''))
    })
  )
  const visibleAriaHidden = adapter?.visibleAriaHidden?.join(',')
  const profile = isolated
    ? `${adapter!.id}:${adapter!.revision ?? 2}`
    : undefined
  const ignored = [
    ignoreSelector,
    ...(isolated ? [articleNoise, ...(adapter?.ignore || [])] : [])
  ]
    .filter(Boolean)
    .join(',')
  const visited = new WeakSet<Node>()
  const stack: (Node | string)[] =
    root.nodeType === 9
      ? [...(isolated ? [] : [document.body]), ...preferred.reverse()]
      : [root]
  const parts: string[] = [],
    roots: (Document | ShadowRoot)[] = [
      document,
      ...new Set(
        preferred
          .map((element) => element.getRootNode())
          .filter((node): node is ShadowRoot => node instanceof ShadowRoot)
      )
    ]
  let size = 0,
    nodes = 0,
    sliceStart = performance.now(),
    truncated = false
  while (stack.length) {
    if (cancelled()) return { text: '', truncated: false, roots: [], nodes }
    if (++nodes % 150 === 0 && performance.now() - sliceStart > 8) {
      await idle()
      sliceStart = performance.now()
    }
    const node = stack.pop()
    if (!node) continue
    if (typeof node === 'string') {
      parts.push(node)
      size += node.length
      continue
    }
    if (visited.has(node)) continue
    visited.add(node)
    if (node.nodeType === 3) {
      const value = node.textContent?.replace(/[\t\r\n ]+/g, ' ') || ''
      parts.push(value)
      size += value.length
      if (size >= MAX_CAPTURE_LENGTH) {
        truncated = true
        break
      }
      continue
    }
    if (node.nodeType !== 1 && node.nodeType !== 11) continue
    if (node.nodeType === 1) {
      const element = node as HTMLElement
      // A preferred article can still be inside a collapsed/responsive container.
      if (
        preferred.includes(element) &&
        (hiddenAncestor(element) || (ignored && element.closest(ignored)))
      )
        continue
      if (
        skipTags.has(element.tagName) ||
        (ignored && element.matches(ignored)) ||
        element.hidden ||
        element.closest('[data-ftb-owned]') ||
        element.isContentEditable ||
        (element.getAttribute('aria-hidden') === 'true' &&
          !(visibleAriaHidden && element.matches(visibleAriaHidden)))
      )
        continue
      if (element.tagName === 'DETAILS' && !element.hasAttribute('open')) {
        const summary = element.querySelector('summary')
        if (summary) stack.push(summary)
        continue
      }
      const style = element.ownerDocument.defaultView?.getComputedStyle(element)
      if (
        style?.display === 'none' ||
        style?.visibility === 'hidden' ||
        style?.visibility === 'collapse' ||
        style?.opacity === '0'
      )
        continue
      const matchesBlock = (rule: { selector: string; text: RegExp }) =>
        element.matches(rule.selector) &&
        rule.text.test((element.textContent || '').replace(/\s+/g, ' ').trim())
      if (excludedBlocks.some(matchesBlock)) continue
      if (stops.some(matchesBlock)) break
      if (element.tagName === 'IFRAME') {
        try {
          const child = (element as HTMLIFrameElement).contentDocument
          if (child?.body) {
            roots.push(child)
            stack.push('\n', child.body, '\n')
          }
        } catch {
          /* cross-origin frames are outside the page's security boundary */
        }
        continue
      }
      const block =
        blockTags.has(element.tagName) ||
        style?.display === 'block' ||
        style?.display === 'flex' ||
        style?.display === 'grid'
      if (block) {
        parts.push('\n')
        stack.push('\n')
      }
      if (element.tagName === 'IMG') {
        const alt = (element as HTMLImageElement).alt
        // Inline icons often repeat the adjacent link label (e.g. Kotlin's
        // Slack link). Keep useful image descriptions without duplicating it.
        if (
          alt &&
          alt.length < 80 &&
          !/^(?:image|photo|picture|图片|图像)$/i.test(alt.trim()) &&
          !element.parentElement?.textContent?.includes(alt)
        ) {
          parts.push(alt)
          size += alt.length
        }
      }
      if (element.shadowRoot) {
        roots.push(element.shadowRoot)
        stack.push(element.shadowRoot)
        continue
      }
      if (element.tagName === 'SLOT') {
        const assigned = (element as HTMLSlotElement).assignedNodes({
          flatten: true
        })
        if (assigned.length) {
          stack.push(...assigned.reverse())
          continue
        }
      }
    }
    stack.push(...Array.from(node.childNodes).reverse())
  }
  return {
    text: cleanText(parts.join('')).slice(0, MAX_CAPTURE_LENGTH),
    truncated,
    roots,
    nodes,
    profile
  }
}
function hiddenAncestor(element: Element) {
  for (
    let parent: Element | null =
      element.parentElement ||
      (element.getRootNode() as ShadowRoot).host ||
      null;
    parent;
    parent =
      parent.parentElement || (parent.getRootNode() as ShadowRoot).host || null
  ) {
    const style = parent.ownerDocument.defaultView?.getComputedStyle(parent)
    if (
      parent.hasAttribute('hidden') ||
      (parent as HTMLElement).isContentEditable ||
      parent.getAttribute('aria-hidden') === 'true' ||
      style?.display === 'none' ||
      style?.visibility === 'hidden' ||
      style?.opacity === '0' ||
      (parent.tagName === 'DETAILS' && !parent.hasAttribute('open'))
    )
      return true
  }
  return false
}
export function cleanText(text: string): string {
  return text
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .split('\n')
    .map((line) => line.replace(/[\t \u00a0]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}
// Preserve already-seen blocks when a virtualized list removes them from the DOM.
// Session-scoped only; a different URL starts a fresh snapshot.
export class SeenText {
  private snapshot = ''
  private blocks = new Map<string, true>()
  private length = 0
  truncated = false
  add(text: string, preserveSnapshot = false) {
    if (preserveSnapshot) {
      const merged = mergeArticleSnapshot(
        this.snapshot,
        text,
        MAX_CAPTURE_LENGTH
      )
      this.snapshot = merged.text
      this.truncated ||= merged.truncated
      return this.snapshot
    }
    for (const block of text.split('\n')) {
      if (!block || this.blocks.has(block)) continue
      if (this.length + block.length > MAX_CAPTURE_LENGTH) {
        this.truncated = true
        break
      }
      this.blocks.set(block, true)
      this.length += block.length + 1
    }
    return [...this.blocks.keys()].join('\n')
  }
}
