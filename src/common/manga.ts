import { FALLBACK_IMAGE_URL } from '@/constants/json'
import { HarpiClient } from '@/crawler/harpi'
import { HitomiClient } from '@/crawler/hitomi/hitomi'
import { HiyobiClient } from '@/crawler/hiyobi'
import { KHentaiClient } from '@/crawler/k-hentai'
import { getOriginFromImageURLs } from '@/crawler/utils'
import { MangaSource } from '@/database/enum'
import { Manga } from '@/types/manga'
import { mergeMangas } from '@/utils/manga'
import { checkDefined } from '@/utils/type'

type MangaResult = Error | Manga | null | undefined

export async function getMangaFromMultipleSources(id: number): Promise<Manga | null> {
  const hiyobiClient = HiyobiClient.getInstance()
  const hitomiClient = HitomiClient.getInstance()
  const kHentaiClient = KHentaiClient.getInstance()
  const harpiClient = HarpiClient.getInstance()

  const [hiyobiManga, hiyobiImages, kHentaiManga, [harpiManga], hitomiManga] = await Promise.all([
    hiyobiClient.fetchManga(id).catch((error) => new Error(error)),
    hiyobiClient.fetchMangaImages(id).catch(() => null),
    kHentaiClient.fetchManga(id).catch((error) => new Error(error)),
    harpiClient
      .fetchMangas({ ids: [id] })
      .then((mangas) => mangas ?? [])
      .catch((error) => [new Error(error)]),
    hitomiClient.fetchManga(id).catch((error) => new Error(error)),
  ])

  const sources: MangaResult[] = [harpiManga, hiyobiManga, kHentaiManga, hitomiManga]
  const definedSources = sources.filter(checkDefined)

  if (definedSources.length === 0) {
    return null
  }

  const errors = definedSources.filter((source): source is Error => source instanceof Error)
  const validMangas = definedSources.filter((source): source is Manga => !(source instanceof Error))

  if (validMangas.length === 0) {
    const error = errors[Math.floor(Math.random() * errors.length)] ?? new Error('알 수 없는 오류')
    return createErrorManga(id, error)
  }

  const validHiyobiManga = validMangas.find((manga) => manga.source === MangaSource.HIYOBI)

  if (validHiyobiManga && hiyobiImages) {
    validHiyobiManga.images = hiyobiImages
  }

  return {
    ...mergeMangas(validMangas),
    ...getOriginFromImageURLs(validMangas[0].images),
  }
}

/**
 * @param ids - 10개 이하의 고유한 만화 ID 배열
 */
export async function getMangasFromMultipleSources(ids: number[]): Promise<Record<number, Manga>> {
  const harpiClient = HarpiClient.getInstance()
  const harpiMangas = await harpiClient.fetchMangas({ ids }).catch((error) => new Error(error))
  const mangaMap: Record<number, Manga> = {}
  const remainingIds = []

  if (harpiMangas) {
    for (const id of ids) {
      const harpiManga = findHarpiManga(harpiMangas, id)

      if (harpiManga) {
        mangaMap[id] = harpiManga
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

  const hiyobiClient = HiyobiClient.getInstance()
  const hitomiClient = HitomiClient.getInstance()
  const kHentaiClient = KHentaiClient.getInstance()

  const [hiyobiMangas, hiyobiImages, kHentaiMangas, hitomiMangas] = await Promise.all([
    Promise.all(remainingIds.map((id) => hiyobiClient.fetchManga(id).catch((error) => new Error(error)))),
    Promise.all(remainingIds.map((id) => hiyobiClient.fetchMangaImages(id).catch(() => null))),
    Promise.all(remainingIds.map((id) => kHentaiClient.fetchManga(id).catch((error) => new Error(error)))),
    Promise.all(remainingIds.map((id) => hitomiClient.fetchManga(id).catch((error) => new Error(error)))),
  ])

  for (let i = 0; i < remainingIds.length; i++) {
    const sources: MangaResult[] = [hiyobiMangas[i], kHentaiMangas[i], hitomiMangas[i]]
    const definedSources = sources.filter(checkDefined)

    if (definedSources.length === 0) {
      continue
    }

    const errors = definedSources.filter((source): source is Error => source instanceof Error)
    const validMangas = definedSources.filter((source): source is Manga => !(source instanceof Error))
    const id = remainingIds[i]

    if (validMangas.length === 0) {
      mangaMap[id] = createErrorManga(id, errors[Math.floor(Math.random() * errors.length)])
      continue
    }

    const validHiyobiManga = validMangas.find((manga) => manga.source === MangaSource.HIYOBI)
    const validHiyobiImages = hiyobiImages[i]

    if (validHiyobiManga && validHiyobiImages) {
      validHiyobiManga.images = validHiyobiImages
    }

    mangaMap[id] = {
      ...mergeMangas(validMangas),
      ...getOriginFromImageURLs(validMangas[0].images),
    }
  }

  return mangaMap
}

function createErrorManga(id: number, error: Error): Manga {
  return { id, title: `${error.name}: ${error.message}\n${error.cause ?? ''}`, images: [FALLBACK_IMAGE_URL] }
}

function findHarpiManga(harpiMangas: Error | Manga[] | null, id: number) {
  if (!harpiMangas || harpiMangas instanceof Error) {
    return null
  }

  return harpiMangas.find((manga) => manga.id === id)
}
