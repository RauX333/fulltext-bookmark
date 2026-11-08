export function isTwitterHost(host: string) {
  return /(^|\.)(x\.com|twitter\.com)$/.test(host)
}

// Use one identity for x.com/twitter.com links and discard share/media suffixes.
// This is also used by the worker, which must validate content-script messages.
export function twitterStatusUrl(raw: string): string | undefined {
  try {
    const url = new URL(raw)
    if (
      !isTwitterHost(url.hostname) ||
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.port
    )
      return
    const status = url.pathname.match(
      /^\/([a-zA-Z0-9_]{1,15}|i\/web)\/status\/(\d+)(?:\/(?:photo|video)\/\d+)?\/?$/
    )
    if (status)
      return `https://x.com/${status[1].toLowerCase()}/status/${status[2]}`
  } catch {
    // Ignore profile links, unsupported URLs and malformed hrefs.
  }
}
