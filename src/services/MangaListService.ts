import { createHentaiPawManga, normalizeManga } from '@/common/manga'
import { harpiClient } from '@/crawler/harpi/harpi'
import { hentaiPawClient } from '@/crawler/hentai-paw'
import { hentKorClient } from '@/crawler/hentkor'
import { hitomiClient } from '@/crawler/hitomi/hitomi'
import { hiyobiClient } from '@/crawler/hiyobi'
import { kHentaiClient } from '@/crawler/k-hentai'
import { Locale } from '@/translation/common'
import { Manga } from '@/types/manga'
import { sec } from '@/utils/date'

type MangaListFetchParams = {
  ids: number[]
  locale: Locale
  revalidate?: number
}

/**
 * @param ids - 10개 이하의 고유한 만화 ID 배열
 */
export async function fetchMangaListFromMultiSources({ ids, locale }: MangaListFetchParams) {
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
  const harpiMangas = await harpiClient.searchMangas({ ids }, locale).catch(() => null)
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

function findHarpiManga(harpiMangas: Error | Manga[] | null, id: number) {
  if (!harpiMangas || harpiMangas instanceof Error) {
    return null
  }

  return harpiMangas.find((manga) => manga.id === id)
}
