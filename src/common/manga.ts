import { NotFoundError } from '@/crawler/errors'
import { harpiClient } from '@/crawler/harpi/harpi'
import { hentaiPawClient } from '@/crawler/hentai-paw'
import { hentKorClient } from '@/crawler/hentkor'
import { hitomiClient } from '@/crawler/hitomi/hitomi'
import { hiyobiClient } from '@/crawler/hiyobi'
import { kHentaiClient } from '@/crawler/k-hentai'
import { MangaSource } from '@/database/enum'
import { Locale } from '@/translation/common'
import { Manga, MangaError } from '@/types/manga'
import { sec } from '@/utils/date'
import { mergeMangas } from '@/utils/manga'
import { checkDefined } from '@/utils/type'

type MangaFetchParams = {
  id: number
  locale: Locale
}

type MangaListFetchParams = {
  ids: number[]
  locale: Locale
  revalidate?: number
}

type MangaResult = Error | Manga | null | undefined

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
      if (manga && manga.id === id) {
        return mergeMangas([manga])
      }
    } catch (e) {
      if (e instanceof NotFoundError) {
        notFoundCount++
      } else {
        console.error(e instanceof Error ? e.message : String(e))
        lastError = e instanceof Error ? e : new Error(String(e))
      }
    }
  }

  if (notFoundCount === sources.length) {
    return null
  }

  // 5. hentkor
  return createErrorManga(id, lastError ?? new Error('모든 소스에서 찾을 수 없어요'))
}

/**
 * @param ids - 10개 이하의 고유한 만화 ID 배열
 */
export async function fetchMangasFromMultiSources({ ids, locale }: MangaListFetchParams) {
  const revalidate = sec('60 days')
  const harpiMangas = await harpiClient.searchMangas({ ids }, locale, revalidate).catch((error) => new Error(error))
  const mangaMap: Record<number, Manga> = {}
  const remainingIds = []

  if (harpiMangas) {
    for (const id of ids) {
      const harpiManga = findHarpiManga(harpiMangas, id)

      if (harpiManga) {
        mangaMap[id] = mergeMangas([harpiManga])
      } else {
        remainingIds.push(id)
      }
    }
  } else {
    remainingIds.push(...ids)
  }

  if (remainingIds.length === 0) {
    return mangaMap
  }

  const [hiyobiMangas, hiyobiImages, kHentaiMangas, hitomiMangas, hentaiPawImages] = await Promise.all([
    Promise.all(remainingIds.map((id) => hiyobiClient.fetchManga({ id, locale, revalidate }).catch(Error))),
    Promise.all(remainingIds.map((id) => hiyobiClient.fetchMangaImages({ id }).catch(() => null))),
    Promise.all(remainingIds.map((id) => kHentaiClient.fetchManga({ id, locale }).catch(Error))),
    Promise.all(remainingIds.map((id) => hitomiClient.fetchManga({ id, locale }).catch(Error))),
    Promise.all(remainingIds.map((id) => hentaiPawClient.fetchMangaImages({ id, revalidate }).catch(() => null))),
  ])

  for (let i = 0; i < remainingIds.length; i++) {
    const id = remainingIds[i]

    const sources: MangaResult[] = [
      hiyobiMangas[i],
      kHentaiMangas[i],
      createHentaiPawManga(id, hentaiPawImages[i]),
      hitomiMangas[i],
    ].filter(checkDefined)

    if (sources.length === 0) {
      mangaMap[id] = {
        id,
        title: '해당 작품을 찾을 수 없어요',
        images: [],
      }
      continue
    }

    const validMangas = sources.filter((source): source is Manga => !(source instanceof Error))
    const errors = sources.filter((source): source is Error => source instanceof Error)

    if (validMangas.length === 0) {
      mangaMap[id] = createErrorManga(id, errors[0])
      continue
    }

    const validHiyobiManga = validMangas.find((manga) => manga.source === MangaSource.HIYOBI)
    const validHentaiPawManga = validMangas.find((manga) => manga.source === MangaSource.HENTAIPAW)
    const validHiyobiImages = hiyobiImages[i]
    const validHentaiPawImages = hentaiPawImages[i]

    if (validHiyobiManga && validHiyobiImages) {
      validHiyobiManga.images = validHiyobiImages.map((image) => ({ original: { url: image } }))
    }

    if (validHentaiPawManga && validHentaiPawImages) {
      validHentaiPawManga.images = validHentaiPawImages.map((image) => ({ original: { url: image } }))
    }

    mangaMap[id] = mergeMangas(validMangas)
  }

  return mangaMap
}

function createErrorManga(id: number, error: Error): MangaError {
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
