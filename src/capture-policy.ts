// Do not archive an access-check/error screen as if it were the requested article.
// This only reads the current DOM; it neither solves nor bypasses challenges.
export function isCaptureInterstitial(document: Document): boolean {
  const title = document.title.trim()
  if (/^(?:PHP: )?404(?: Not Found| Page not found.*| \| .+)$/i.test(title))
    return true
  if (
    /^(Error - 404 - Not Found|Wikimedia Error|Page not found(?: \| .*)?|Not Found \(404\)(?: - .*)?)$/i.test(
      title
    )
  )
    return true
  if (
    /^(Just a moment\.{0,3}|Access Denied|Access Restricted|Security Verification|403 Forbidden|404 Not Found|502 Bad Gateway|503 Service (Temporarily )?Unavailable|Attention Required!\s*\|\s*Cloudflare|HTTP 404 - SegmentFault)$/i.test(
      title
    )
  )
    return true
  const host = document.location?.hostname || ''
  const shortBody = document.body?.innerText?.slice(0, 1500) || ''
  const bodyLength = document.body?.innerText?.length || 0
  if (
    /^(请求已被拦截|WAF拦截页面|Access Blocked|Access unavailable|Service unavailable|Access to this page has been denied\.?)$/i.test(
      title
    ) ||
    (title === 'Radware Page' &&
      shortBody.includes('Verifying your browser before proceeding')) ||
    (bodyLength < 2000 &&
      (/^If you are a reader experiencing an access issue, please contact support@people\.inc\./.test(
        shortBody.trim()
      ) ||
        /^Sorry, your request has been blocked as it may cause potential threats to the server/.test(
          shortBody.trim()
        ) ||
        /^Checking the security of your connection\.\.\./.test(
          shortBody.trim()
        ) ||
        /^Access denied\.\s*Check whether a proxy or VPN is used\./i.test(
          shortBody.trim()
        ) ||
        /^(请滑动完成验证|请按住滑块，拖动到最右边)/.test(shortBody.trim())))
  )
    return true
  if (
    title === 'Verifying Device' &&
    bodyLength < 600 &&
    /Verification failed|Verifying your device, please wait/.test(shortBody)
  )
    return true
  if (
    (host === 'qyer.com' || host.endsWith('.qyer.com')) &&
    bodyLength < 500 &&
    shortBody.trim().startsWith('安全验证') &&
    shortBody.includes('完成安全验证')
  )
    return true
  if (
    title === 'ERROR: The request could not be satisfied' ||
    title === '404错误提示' ||
    (title === '提示信息' && shortBody.includes('访问地址无效'))
  )
    return true
  if (
    (shortBody.includes('Security Detection Powered By SafeLine WAF') &&
      shortBody.includes('Confirm You Are Human')) ||
    (host === 'support.arm.com' &&
      document.location.pathname === '/documentation/500') ||
    (title === 'Verification' &&
      shortBody.includes('Please slide to verify')) ||
    (title === 'Oh noes!' && shortBody.includes('Access Denied: error code'))
  )
    return true
  if (
    host === 'mp.weixin.qq.com' &&
    document.location.pathname.startsWith('/s') &&
    !document.querySelector('#js_content')
  )
    return true
  const heading = document.querySelector('h1')?.textContent?.trim() || ''
  if (
    /^(Access Denied|Access Verification|Page not found|This page could not be found|Verify you are human|环境异常|访问验证|安全验证|该内容已被发布者删除)$/i.test(
      heading
    )
  )
    return true
  return (
    !!document.querySelector(
      '#challenge-running, #challenge-stage, #cf-challenge-running'
    ) && !document.querySelector('article p, #js_content')
  )
}
