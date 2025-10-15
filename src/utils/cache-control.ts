import { CANONICAL_URL } from '@/constants'

import { sec } from './date'

export function calculateOptimalCacheDuration(images: string[]): number {
  const now = Math.floor(Date.now() / 1000)
  let nearestExpiration

  for (const imageUrl of images) {
    const expiration = extractExpirationFromURL(imageUrl)
    if (expiration && expiration > now) {
      if (!nearestExpiration || expiration < nearestExpiration) {
        nearestExpiration = expiration
      }
    }
  }

  if (!nearestExpiration) {
    return sec('30 days')
  }

  // Apply a small buffer (5 minutes) for:
  // - Clock skew between servers
  // - Request processing time
  // - User's actual image loading time
  const buffer = sec('5 minutes')

  return nearestExpiration - buffer - now
}

function extractExpirationFromURL(imageUrl: string): number | null {
  try {
    const url = new URL(imageUrl, CANONICAL_URL)
    const expires = url.searchParams.get('expires')
    if (expires && /^\d+$/.test(expires)) {
      return parseInt(expires, 10)
    }
  } catch {
    // Not a valid URL
  }
  return null
}
