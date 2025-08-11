import 'server-only'

import { MangaSource } from '@/database/enum'
import { translateLanguageList } from '@/translation/language'
import { translateTag } from '@/translation/tag'
import { Manga } from '@/types/manga'

import { ProxyClient, ProxyClientConfig } from '../proxy'
import { isUpstreamServer5XXError } from '../proxy-utils'
import { getOriginFromImageURLs } from '../utils'
import { BinaryIdMap } from './BinaryIdMap'
import idMap from './id.json'

type KomiManga = {
  id: string
  title: string
  artist: string
  group: string
  category: string
  language: string
  tags: {
    id: string
    namespace: string
    name: string
  }[]
  images: {
    bucketName: string
    contentType: string
    hash: string
    height: number
    isSinglePageSpread: boolean
    objectKey: string
    pageNumber: number
    sizeBytes: number
    url: string
    width: number
  }[]
  uploadDate: string
  pages: number
  favorites: number
  rating: number | null
  viewCount: number
  bookmarks: string
  sourceId: string
  characters: string[]
  comments: number
  createdAt: string
  isBlocked: boolean
}

const KOMI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://komi.la',
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 60000, // 1 minute
    shouldCountAsFailure: isUpstreamServer5XXError,
  },
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
  },
  defaultHeaders: {
    accept:
      'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    Origin: 'https://komi.la',
    Referer: 'https://komi.la/',
  },
}

export class KomiClient {
  private static instance: KomiClient
  private readonly client: ProxyClient
  private readonly idMapping: BinaryIdMap

  // Singleton instance
  private constructor() {
    this.client = new ProxyClient(KOMI_CONFIG)
    this.idMapping = new BinaryIdMap(idMap as [number, string][])
  }

  static getInstance(): KomiClient {
    if (!KomiClient.instance) {
      KomiClient.instance = new KomiClient()
    }
    return KomiClient.instance
  }

  async fetchManga(id: number, revalidate = 86400): Promise<Manga | null> {
    const uuid = this.idMapping.get(id)

    if (!uuid) {
      return null
    }

    const response = await this.client.fetch<KomiManga>(`/api/galleries/${uuid}`, {
      cache: revalidate > 0 ? 'force-cache' : 'no-store',
      next: { revalidate },
    })

    return this.convertKomiToManga(response, id)
  }

  private convertKomiToManga(komiManga: KomiManga, numericId: number): Manga {
    const locale = 'ko' // TODO: Get from user preferences or context

    return {
      id: numericId,
      title: komiManga.title,
      artists: komiManga.artist ? [{ label: komiManga.artist, value: komiManga.artist }] : undefined,
      group: komiManga.group ? [{ label: komiManga.group, value: komiManga.group }] : undefined,
      type: komiManga.category,
      languages: translateLanguageList([komiManga.language], locale),
      date: komiManga.createdAt,
      viewCount: komiManga.viewCount,
      count: komiManga.pages,
      rating: komiManga.rating ?? undefined,
      tags: komiManga.tags.map(({ name, namespace }) => translateTag(namespace, name, locale)),
      source: MangaSource.KOMI,
      ...getOriginFromImageURLs(komiManga.images.sort((a, b) => a.pageNumber - b.pageNumber).map((img) => img.url)),
    }
  }
}
