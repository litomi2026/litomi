/**
 * Utility functions for handling push device identification
 */

/**
 * Formats device information for display
 */
export function formatDeviceInfo(userAgent: string | null): string {
  if (!userAgent) {
    return `알 수 없는 브라우저`
  }

  const { browser, os, device } = getDeviceInfo(userAgent)
  return `${browser} ${os} ${device}`
}

/**
 * Gets device information from user agent string
 */
export function getDeviceInfo(userAgent: string): {
  browser: string
  os: string
  device: string
} {
  // Simple parsing - you might want to use a library like ua-parser-js for better accuracy
  const browser = userAgent.includes('Chrome')
    ? 'Chrome'
    : userAgent.includes('Firefox')
      ? 'Firefox'
      : userAgent.includes('Safari')
        ? 'Safari'
        : 'Unknown'

  const os = userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Mac')
      ? 'macOS'
      : userAgent.includes('Linux')
        ? 'Linux'
        : userAgent.includes('Android')
          ? 'Android'
          : userAgent.includes('iOS')
            ? 'iOS'
            : ''

  const device = userAgent.includes('Mobile') ? '모바일' : '데스크탑'

  return { browser, os, device }
}
