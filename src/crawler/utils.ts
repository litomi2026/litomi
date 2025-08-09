import { FALLBACK_IMAGE_URL } from '@/constants/json'

export function getOriginFromImageURLs(urls: string[] | null | undefined) {
  if (!urls || urls.length === 0) {
    return { images: [FALLBACK_IMAGE_URL] }
  }

  try {
    const firstOrigin = new URL(urls[0]).origin

    const allSameOrigin = urls.every((url) => {
      try {
        return new URL(url).origin === firstOrigin
      } catch {
        return false
      }
    })

    if (!allSameOrigin) {
      return { images: urls }
    }

    return { origin: firstOrigin, images: urls.map((url) => url.replace(firstOrigin, '')) }
  } catch {
    return { images: urls }
  }
}
