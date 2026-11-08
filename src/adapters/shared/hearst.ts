// Shared rendered components observed across Hearst publications. Keep editorial
// embeds and images; exclude only recommendations, signup and author widgets.
export const hearstArticleNoise = [
  'aside',
  'journey-inline-newsletter',
  'journey-billboard',
  '.piano-inline-newsletter',
  '[data-embed="recirculation"]',
  '[aria-labelledby="recirc-heading"]',
  '[class*="eu41nyu0"]'
]

export const hearstBoilerplate = [
  {
    selector: 'div[data-ad-exclude]',
    text: /^This content is imported from OpenWeb\./
  }
]
