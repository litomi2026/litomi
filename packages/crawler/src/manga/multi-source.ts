import type { Locale } from '@litomi/domain/locale'
import { type Manga, type MangaError, tagCategoryNameToInt } from '@litomi/domain/manga/model'
import { sec } from '@litomi/std'

import { AllSourcesFailedError, isAbortError, NotFoundError } from '../core/errors'
import { hentaiPawClient } from '../sources/hentai-paw'
import { hentKorClient } from '../sources/hentkor'
import { hitomiClient } from '../sources/hitomi/hitomi'
import { hiyobiClient } from '../sources/hiyobi'
import { kHentaiClient } from '../sources/k-hentai'

type MangaFetchParams = {
  id: number
  locale: Locale
  signal?: AbortSignal
}

export async function fetchMangaFromMultiSources({ id, locale, signal }: MangaFetchParams) {
  const revalidate = sec('60 days')

  const sources = [
    // 1. hiyobi (한국어 작품만 지원)
    async () => {
      const manga = await hiyobiClient.fetchManga({ id, locale, revalidate, signal })
      if (!manga) {
        return null
      }

      const images = await hiyobiClient.fetchMangaImages({ id, signal })
      if (!images || images.length === 0) {
        return null
      }

      manga.images = images.map((url) => ({ original: { url } }))

      return manga
    },

    // 2. hitomi
    () => hitomiClient.fetchManga({ id, locale, signal }),

    // 3. kHentai
    () => kHentaiClient.fetchManga({ id, locale, signal }),

    // 4. hentaiPaw
    async () => {
      const manga = await hentaiPawClient.fetchManga({ id, locale, revalidate, signal })
      if (!manga) {
        return null
      }

      const images = await hentaiPawClient.fetchMangaImages({ id, revalidate, signal })
      if (!images || images.length === 0) {
        return null
      }

      const coverThumbnail = manga.images?.[0]?.thumbnail

      manga.images = images.map((url, i) => {
        if (i === 0 && coverThumbnail) {
          return { original: { url }, thumbnail: coverThumbnail }
        }
        return { original: { url } }
      })

      return manga
    },
  ]

  let lastError: Error | null = null
  let notFoundCount = 0

  for (const fetchSource of sources) {
    try {
      signal?.throwIfAborted()
      const manga = await fetchSource()

      if (!manga || manga.id !== id) {
        notFoundCount++
        continue
      }

      return normalizeManga(manga)
    } catch (e) {
      if (e instanceof NotFoundError) {
        notFoundCount++
      } else {
        if (isAbortError(e)) {
          throw e
        }

        lastError = e instanceof Error ? e : new Error(String(e))
      }
    }
  }

  if (notFoundCount === sources.length) {
    return null
  }

  // 5. hentkor
  return createErrorManga(id, lastError ?? new AllSourcesFailedError())
}

function createErrorManga(id: number, error: Error): MangaError {
  if (!(error instanceof AllSourcesFailedError)) {
    console.error(error.message)
  }

  return {
    id,
    title: `${error.message}`,
    images: hentKorClient.fetchMangaImages(id, 100).map((image) => ({ original: { url: image } })),
    isError: true,
  }
}

function normalizeManga(manga: Manga): Manga {
  if (manga.tags) {
    manga.tags.sort((a, b) => {
      if (a.category === b.category) {
        return a.label.localeCompare(b.label)
      }
      return tagCategoryNameToInt[a.category] - tagCategoryNameToInt[b.category]
    })
  }

  for (const key in manga) {
    if (manga[key as keyof Manga] === undefined) {
      delete manga[key as keyof Manga]
    }
  }

  return manga
}
