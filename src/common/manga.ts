import { AllSourcesFailedError, NotFoundError } from '@/crawler/errors'
import { harpiClient } from '@/crawler/harpi/harpi'
import { hentaiPawClient } from '@/crawler/hentai-paw'
import { hentKorClient } from '@/crawler/hentkor'
import { hitomiClient } from '@/crawler/hitomi/hitomi'
import { hiyobiClient } from '@/crawler/hiyobi'
import { kHentaiClient } from '@/crawler/k-hentai'
import { MangaSource, tagCategoryNameToInt } from '@/database/enum'
import { Locale } from '@/translation/common'
import { Manga, MangaError } from '@/types/manga'
import { sec } from '@/utils/date'

type MangaFetchParams = {
  id: number
  locale: Locale
}

type MangaListFetchParams = {
  ids: number[]
  locale: Locale
  revalidate?: number
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
      const images = await hentaiPawClient.fetchMangaImages({ id, revalidate })
      return createHentaiPawManga(id, images)
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

/**
 * @param ids - 10개 이하의 고유한 만화 ID 배열
 */
export async function fetchMangasFromMultiSources({ ids, locale }: MangaListFetchParams) {
  const revalidate = sec('60 days')
  const mangaMap: Record<number, Manga> = {}
  let remainingIds = [...ids]

  async function trySource(fetcher: (id: number) => Promise<Manga | null>) {
    const results = await Promise.all(remainingIds.map(fetcher))

    for (let i = 0; i < remainingIds.length; i++) {
      const manga = results[i]
      if (manga) {
        mangaMap[remainingIds[i]] = normalizeManga(manga)
      }
    }

    remainingIds = remainingIds.filter((id) => !mangaMap[id])
  }

  // 1. harpi
  const harpiMangas = await harpiClient.searchMangas({ ids }, locale, revalidate).catch(() => null)
  if (harpiMangas) {
    for (const id of ids) {
      const manga = findHarpiManga(harpiMangas, id)
      if (manga) {
        mangaMap[id] = normalizeManga(manga)
      }
    }
    remainingIds = remainingIds.filter((id) => !mangaMap[id])
  }

  if (remainingIds.length === 0) {
    return mangaMap
  }

  // 2. hiyobi
  await trySource(async (id) => {
    try {
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
    } catch {
      return null
    }
  })

  if (remainingIds.length === 0) {
    return mangaMap
  }

  // 3. hitomi (한국어만)
  await trySource(async (id) => {
    try {
      const manga = await hitomiClient.fetchManga({ id, locale })
      const hasKorean = manga?.languages?.some((l) => l.value === 'korean')
      return hasKorean ? manga : null
    } catch {
      return null
    }
  })

  if (remainingIds.length === 0) {
    return mangaMap
  }

  // 4. kHentai
  await trySource((id) => kHentaiClient.fetchManga({ id, locale }).catch(() => null))

  if (remainingIds.length === 0) {
    return mangaMap
  }

  // 5. hentaiPaw
  await trySource(async (id) => {
    const images = await hentaiPawClient.fetchMangaImages({ id, revalidate }).catch(() => null)
    return createHentaiPawManga(id, images)
  })

  // 찾지 못한 ID는 hentkor fallback 이미지 제공
  for (const id of remainingIds) {
    mangaMap[id] = {
      id,
      title: '해당 작품을 찾을 수 없어요',
      images: hentKorClient.fetchMangaImages(id, 100).map((url) => ({ original: { url } })),
    }
  }

  return mangaMap
}

function createErrorManga(id: number, error: Error): MangaError {
  if (!(error instanceof AllSourcesFailedError)) {
    console.error(error.message)
  }
  return {
    id,
    title: `${error.message}\n${error.cause ?? ''}`,
    images: hentKorClient.fetchMangaImages(id, 100).map((image) => ({ original: { url: image } })),
    isError: true,
  }
}

function createHentaiPawManga(id: number, images?: string[] | null): Manga | null {
  if (!images || images.length === 0) {
    return null
  }

  return {
    id,
    title: id.toString(),
    images: images.map((image) => ({ original: { url: image } })),
    source: MangaSource.HENTAIPAW,
    count: images.length,
  }
}

function findHarpiManga(harpiMangas: Error | Manga[] | null, id: number) {
  if (!harpiMangas || harpiMangas instanceof Error) {
    return null
  }

  return harpiMangas.find((manga) => manga.id === id)
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
