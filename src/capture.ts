import { preferredRoots } from './adapters'
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
  cancelled = () => false
): Promise<Capture> {
  const document =
    root.nodeType === 9 ? (root as Document) : root.ownerDocument!
  const preferred =
    root.nodeType === 9
      ? preferredRoots(document, document.location?.hostname || '')
      : []
  const visited = new WeakSet<Node>()
  const stack: (Node | string)[] =
    root.nodeType === 9 ? [document.body, ...preferred.reverse()] : [root]
  const parts: string[] = [],
    roots: (Document | ShadowRoot)[] = [document]
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
      if (preferred.includes(element) && hiddenAncestor(element)) continue
      if (
        skipTags.has(element.tagName) ||
        element.hidden ||
        element.closest('[data-ftb-owned]') ||
        element.isContentEditable ||
        element.getAttribute('aria-hidden') === 'true'
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
        if (alt && alt.length < 80) {
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
    nodes
  }
}
function hiddenAncestor(element: Element) {
  for (
    let parent = element.parentElement;
    parent;
    parent = parent.parentElement
  ) {
    const style = parent.ownerDocument.defaultView?.getComputedStyle(parent)
    if (
      parent.hidden ||
      parent.isContentEditable ||
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
  private blocks = new Map<string, true>()
  private length = 0
  truncated = false
  add(text: string) {
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
