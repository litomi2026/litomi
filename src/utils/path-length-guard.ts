export const MAX_APP_PATH_LENGTH = 64

const excludedPathPrefixes = [
  '/_next/static/',
  '/_next/image',
  '/cdn-cgi/challenge-platform/',
  '/.well-known/',
  '/image/',
]

const excludedPaths = [
  '/favicon.ico',
  '/icon.png',
  '/apple-icon.png',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/sw.js',
  '/ads.txt',
  '/og-image.avif',
  '/og-image.webp',
  '/web-app-manifest-144x144.png',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
]

export function getPathLengthBlockStatus(pathname: string): 414 | null {
  if (excludedPaths.includes(pathname) || excludedPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null
  }

  if (pathname.length > MAX_APP_PATH_LENGTH) {
    return 414
  }

  return null
}
