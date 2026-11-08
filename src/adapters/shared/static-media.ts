// Infinite scrolling changes the URL while leaving earlier articles in the DOM.
// Each article contains several body sections, identified by its own heading ID.
export const staticMediaIdentity = {
  selector: 'h1[data-post-id]',
  attribute: 'data-post-id',
  path: /^\/(\d+)\//
}
export const staticMediaNoise = [
  '.breadcrumbs',
  '.add-on-google-widget',
  '.adthrive-ad'
]
