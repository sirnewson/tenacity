// Where the poster can actually be saved depends on the browser, and the
// differences are not detectable after the fact — a failed <a download> on iOS
// throws nothing, it just silently does nothing. So decide up front.

export function isIOS(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints) {
  // iPadOS 13+ reports a desktop Macintosh UA; touch points give it away.
  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)
}

export function isInAppBrowser(ua = navigator.userAgent) {
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|TikTok|Snapchat|Pinterest|LinkedInApp|WhatsApp/i.test(ua)
}

/**
 * How to hand the finished poster to the user.
 *   'share'     native share sheet — the only route that reaches the camera roll
 *   'longpress' open the image so it can be long-pressed and saved
 *   'download'  <a download> — desktop and Android Chrome
 */
export function pickSaveStrategy({ ua, touchPoints, canShareFiles }) {
  const onPhone = isIOS(ua, touchPoints) || isInAppBrowser(ua)
  // <a download> is a no-op on iOS and blocked in social in-app browsers.
  if (onPhone) return canShareFiles ? 'share' : 'longpress'
  // Android Chrome honours <a download> for blob: URLs, so it deliberately
  // stays on 'download' — the file lands in Downloads. The SHARE button is
  // the route to the gallery / straight into an app.
  return 'download'
}
