import { selectAdapter } from './registry'

export function preferredRoots(document: Document, host: string): Element[] {
  const adapter = selectAdapter(host, document.location?.pathname)
  const selectors = adapter?.content || ['article', 'main', '[role="main"]']
  const scopes: (Document | ShadowRoot)[] = [document]
  if (adapter?.shadow) {
    for (let i = 0; i < scopes.length; i++)
      for (const element of scopes[i].querySelectorAll('*'))
        if (element.shadowRoot) scopes.push(element.shadowRoot)
  }
  const query = (selector: string) =>
    scopes.flatMap((scope) => [...scope.querySelectorAll(selector)])
  const usable = (element: Element) => {
    for (
      let parent: Element | null = element;
      parent;
      parent =
        parent.parentElement ||
        (parent.getRootNode() as ShadowRoot).host ||
        null
    ) {
      const style = document.defaultView?.getComputedStyle(parent)
      if (
        parent.hasAttribute('hidden') ||
        parent.getAttribute('aria-hidden') === 'true' ||
        style?.display === 'none' ||
        style?.visibility === 'hidden' ||
        style?.opacity === '0'
      )
        return false
    }
    return true
  }
  const identity = adapter?.rootIdentity
  const expectedId = identity
    ? new RegExp(
        identity.path.source,
        identity.path.flags.replace(/[gy]/g, '')
      ).exec(document.location.pathname)?.[1]
    : undefined
  const matchesIdentity = (element: Element) =>
    !identity ||
    (!!expectedId &&
      element
        .querySelector(identity.selector)
        ?.getAttribute(identity.attribute) === expectedId)
  const found = adapter?.firstMatch
    ? selectors
        .map((selector) =>
          query(selector).filter(usable).filter(matchesIdentity)
        )
        .find((nodes) => nodes.length) || []
    : query(selectors.join(',')).filter(matchesIdentity)
  return found
    .filter(
      (node) =>
        !found.some((parent) => parent !== node && parent.contains(node))
    )
    .slice(0, adapter?.maxRoots ?? 100)
}
export function pageTitle(document: Document, host: string) {
  const selectors = selectAdapter(host, document.location?.pathname)?.title
  return (
    (selectors &&
      document.querySelector(selectors.join(','))?.textContent?.trim()) ||
    document.title
  )
}
