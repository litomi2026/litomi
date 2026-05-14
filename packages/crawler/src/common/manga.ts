import { Locale } from '@litomi/catalog/translation/common'
import { AllSourcesFailedError, NotFoundError } from '@litomi/crawler/crawler/errors'
import { hentaiPawClient } from '@litomi/crawler/crawler/hentai-paw'
import { hentKorClient } from '@litomi/crawler/crawler/hentkor'
import { hitomiClient } from '@litomi/crawler/crawler/hitomi/hitomi'
import { hiyobiClient } from '@litomi/crawler/crawler/hiyobi'
import { kHentaiClient } from '@litomi/crawler/crawler/k-hentai'
import { tagCategoryNameToInt } from '@litomi/domain/database/enum'
import { Manga, MangaError } from '@litomi/domain/types/manga'
import { sec } from '@litomi/std/format/date'

type MangaFetchParams = {
  id: number
  locale: Locale
}

export async function fetchMangaFromMultiSources({ id, locale }: MangaFetchParams) {
  const revalidate = sec('60 days')

  const sources = [
    // 1. hiyobi (한국어 작품만 지원)
    async () => {
      const manga = await hiyobiClient.fetchManga({ id, locale, revalidate })
      if (!manga) {
        return null
      }

      const images = await hiyobiClient.fetchMangaImages({ id })
      if (!images || images.length === 0) {
        return null
      }

      manga.images = images.map((url) => ({ original: { url } }))

      return manga
    },

    // 2. hitomi (한국어 작품만 이미지 지원, 나머지 작품은 이미지 없음)
    async () => {
      const manga = await hitomiClient.fetchManga({ id, locale })
      const hasKorean = manga?.languages?.some((l) => l.value === 'korean')
      return hasKorean ? manga : null
    },

    // 3. kHentai
    () => kHentaiClient.fetchManga({ id, locale }),

    // 4. hentaiPaw
    async () => {
      const manga = await hentaiPawClient.fetchManga({ id, revalidate })
      if (!manga) {
        return null
      }

      const images = await hentaiPawClient.fetchMangaImages({ id, revalidate })
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
