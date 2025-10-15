import ms from 'ms'
import 'server-only'

import { MangaSource } from '@/database/enum'
import { translateLanguageList } from '@/translation/language'
import { translateTag } from '@/translation/tag'
import { translateType } from '@/translation/type'
import { Manga } from '@/types/manga'

import { ProxyClient, ProxyClientConfig } from '../proxy'
import { isUpstreamServerError } from '../proxy-utils'
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
  tags: KomiTag[]
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

type KomiTag = {
  id: string
  namespace: string
  name: string
}

type MangaFetchParams = {
  id: number | string
  revalidate?: number
}

const KOMI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://komi.la',
  circuitBreaker: {
    failureThreshold: 3,
    successThreshold: 3,
    timeout: ms('10 minutes'),
    shouldCountAsFailure: isUpstreamServerError,
  },
  retry: {
    maxRetries: 2,
    initialDelay: ms('1 second'),
    maxDelay: ms('5 seconds'),
    backoffMultiplier: 2,
    jitter: true,
  },
  requestTimeout: ms('5 seconds'),
  defaultHeaders: {
    accept:
      'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    Origin: 'https://komi.la',
    Referer: 'https://komi.la/',
  },
}

const VALID_KOMI_TAG_CATEGORIES = ['female', 'male', 'mixed', 'misc'] as const
type KomiTagCategory = (typeof VALID_KOMI_TAG_CATEGORIES)[number]

class KomiClient {
  private readonly client: ProxyClient
  private readonly idMapping: BinaryIdMap

  constructor() {
    this.client = new ProxyClient(KOMI_CONFIG)
    this.idMapping = new BinaryIdMap(idMap as [number, string][])
  }

  async fetchManga({ id, revalidate }: MangaFetchParams): Promise<Manga | null> {
    const uuid = typeof id === 'number' ? this.idMapping.get(id) : id

    if (!uuid) {
      return null
    }

    const response = await this.client.fetch<KomiManga>(`/api/galleries/${uuid}`, {
      next: { revalidate },
    })

    return this.convertKomiToManga(response, typeof id === 'number' ? id : 1)
  }

  private convertKomiToManga(komiManga: KomiManga, numericId: number): Manga {
    const locale = 'ko' // TODO: Get from user preferences or context

    return {
      id: numericId,
      title: komiManga.title,
      artists: komiManga.artist ? [{ label: komiManga.artist, value: komiManga.artist }] : undefined,
      group: komiManga.group ? [{ label: komiManga.group, value: komiManga.group }] : undefined,
      type: translateType(komiManga.category, locale),
      languages: translateLanguageList([komiManga.language], locale),
      date: komiManga.createdAt,
      viewCount: komiManga.viewCount,
      count: komiManga.pages,
      rating: komiManga.rating ?? undefined,
      tags: komiManga.tags
        .filter(this.isValidKomiTag)
        .map(({ name, namespace }) => translateTag(namespace, name, locale)),
      source: MangaSource.KOMI,
      ...getOriginFromImageURLs(komiManga.images.sort((a, b) => a.pageNumber - b.pageNumber).map((img) => img.url)),
    }
  }

  // NOTE: komi에서 언어 등의 값도 태그로 내려줘서, 진짜 태그만 추출하기 위한 함수
  private isValidKomiTag(tag: KomiTag): tag is { id: string; namespace: KomiTagCategory; name: string } {
    return VALID_KOMI_TAG_CATEGORIES.includes(tag.namespace as KomiTagCategory)
  }
}

// Singleton instance
export const komiClient = new KomiClient()
