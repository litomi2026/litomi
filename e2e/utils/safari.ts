// NOTE: Safari 기반 브라우저는 localhost에서 secure 쿠키를 사용할 수 없음
export function isSafariLocalhost(browserName: string, url: string): boolean {
  const parsedUrl = new URL(url)
  const isLocalhost = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1'
  return browserName === 'webkit' && isLocalhost
}
