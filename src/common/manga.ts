import { get } from '@vercel/edge-config'

import { EDGE_CONFIG } from '@/constants/env'
import { HarpiClient } from '@/crawler/harpi/harpi'
import { HentaiPawClient } from '@/crawler/hentai-paw'
import { HentKorClient } from '@/crawler/hentkor'
import { HitomiClient } from '@/crawler/hitomi/hitomi'
import { HiyobiClient } from '@/crawler/hiyobi'
import { KHentaiClient } from '@/crawler/k-hentai'
import { KomiClient } from '@/crawler/komi/komi'
import { getOriginFromImageURLs } from '@/crawler/utils'
import { MangaSource } from '@/database/enum'
import { Manga, MangaError } from '@/types/manga'
import { mergeMangas } from '@/utils/manga'
import { checkDefined } from '@/utils/type'

type MangaResult = Error | Manga | null | undefined

type ProxyConfig = {
  komi: boolean
  hiyobi: boolean
  hitomi: boolean
  'k-hentai': boolean
  harpi: boolean
  'hentai-paw': boolean
}

const DEFAULT_PROXY_CONFIG: ProxyConfig = {
  komi: true,
  hiyobi: true,
  hitomi: true,
  'k-hentai': true,
  harpi: true,
  'hentai-paw': true,
}

// TODO: 추후 'use cache' 로 변경하고 revalidate 파라미터 제거하기
export async function getMangaFromMultiSources(id: number, revalidate?: number): Promise<Manga | MangaError | null> {
  // cacheLife('days')

  const {
    komi,
    hiyobi,
    hitomi,
    'k-hentai': kHentai,
    harpi,
    'hentai-paw': hentaiPaw,
  } = (EDGE_CONFIG ? await get<ProxyConfig>('proxy') : DEFAULT_PROXY_CONFIG) ?? {}

  const hiyobiClient = hiyobi ? HiyobiClient.getInstance() : null
  const hitomiClient = hitomi ? HitomiClient.getInstance() : null
  const kHentaiClient = kHentai ? KHentaiClient.getInstance() : null
  const harpiClient = harpi ? HarpiClient.getInstance() : null
  const komiClient = komi ? KomiClient.getInstance() : null
  const hentaiPawClient = hentaiPaw ? HentaiPawClient.getInstance() : null

  const [hiyobiManga, hiyobiImages, kHentaiManga, harpiManga, komiManga, hitomiManga, hentaiPawImages] =
    await Promise.all([
      hiyobiClient?.fetchManga(id).catch((error) => new Error(error)),
      hiyobiClient?.fetchMangaImages(id, revalidate).catch(() => null),
      kHentaiClient?.fetchManga(id, revalidate).catch((error) => new Error(error)),
      harpiClient?.fetchManga(id).catch((error) => new Error(error)),
      komiClient?.fetchManga(id).catch((error) => new Error(error)),
      hitomiClient?.fetchManga(id, revalidate).catch((error) => new Error(error)),
      hentaiPawClient?.fetchMangaImages(id).catch(() => null),
    ])

  const sources: MangaResult[] = [
    harpiManga,
    komiManga,
    hiyobiManga,
    kHentaiManga,
    createHentaiPawManga(id, hentaiPawImages),
    hitomiManga,
  ].filter(checkDefined)

  if (sources.length === 0) {
    return null
  }

  const validMangas = sources.filter((source): source is Manga => !(source instanceof Error))
  const errors = sources.filter((source): source is Error => source instanceof Error)

  if (validMangas.length === 0) {
    return createErrorManga(id, errors[0])
  }

  const validHiyobiManga = validMangas.find((manga) => manga.source === MangaSource.HIYOBI)

  if (validHiyobiManga && hiyobiImages) {
    validHiyobiManga.images = hiyobiImages
  }

  return {
    ...mergeMangas(validMangas),
    ...getOriginFromImageURLs(validMangas[0].images),
    sources: validMangas.map((manga) => manga.source).filter(checkDefined),
  }
}

/**
 * @param ids - 10개 이하의 고유한 만화 ID 배열
 */
export async function getMangasFromMultiSources(
  ids: number[],
  revalidate: number,
): Promise<Record<number, Manga | MangaError>> {
  const {
    komi,
    hiyobi,
    hitomi,
    'k-hentai': kHentai,
    harpi,
    'hentai-paw': hentaiPaw,
  } = (EDGE_CONFIG ? await get<ProxyConfig>('proxy') : DEFAULT_PROXY_CONFIG) ?? {}

  const harpiClient = harpi ? HarpiClient.getInstance() : null
  const harpiMangas = await harpiClient?.searchMangas({ ids }, revalidate).catch((error) => new Error(error))
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

  const hiyobiClient = hiyobi ? HiyobiClient.getInstance() : null
  const hitomiClient = hitomi ? HitomiClient.getInstance() : null
  const kHentaiClient = kHentai ? KHentaiClient.getInstance() : null
  const komiClient = komi ? KomiClient.getInstance() : null
  const hentaiPawClient = hentaiPaw ? HentaiPawClient.getInstance() : null

  const [hiyobiMangas, hiyobiImages, kHentaiMangas, komiMangas, hitomiMangas, hentaiPawImages] = await Promise.all([
    Promise.all(remainingIds.map((id) => hiyobiClient?.fetchManga(id).catch((error) => new Error(error)))),
    Promise.all(remainingIds.map((id) => hiyobiClient?.fetchMangaImages(id, revalidate).catch(() => null))),
    Promise.all(remainingIds.map((id) => kHentaiClient?.fetchManga(id, revalidate).catch((error) => new Error(error)))),
    Promise.all(remainingIds.map((id) => komiClient?.fetchManga(id).catch((error) => new Error(error)))),
    Promise.all(remainingIds.map((id) => hitomiClient?.fetchManga(id, revalidate).catch((error) => new Error(error)))),
    Promise.all(remainingIds.map((id) => hentaiPawClient?.fetchMangaImages(id).catch(() => null))),
  ])

  for (let i = 0; i < remainingIds.length; i++) {
    const id = remainingIds[i]

    const sources: MangaResult[] = [
      komiMangas[i],
      hiyobiMangas[i],
      kHentaiMangas[i],
      createHentaiPawManga(id, hentaiPawImages[i]),
      hitomiMangas[i],
    ].filter(checkDefined)

    if (sources.length === 0) {
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
      validHiyobiManga.images = validHiyobiImages
    }

    if (validHentaiPawManga && validHentaiPawImages) {
      validHentaiPawManga.images = validHentaiPawImages
    }

    mangaMap[id] = {
      ...mergeMangas(validMangas),
      ...getOriginFromImageURLs(validMangas[0].images),
      sources: validMangas.map((manga) => manga.source).filter(checkDefined),
    }
  }

  return mangaMap
}

function createErrorManga(id: number, error: Error): MangaError {
  const images = HentKorClient.getInstance().fetchMangaImages(id, 100)
  return {
    id,
    title: `${error?.message}\n${error?.cause ?? ''}`,
    ...getOriginFromImageURLs(images),
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
    images,
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
