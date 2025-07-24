import { translateArtistList } from '@/translation/artist'
import { translateCharacterList } from '@/translation/character'
import { Multilingual, normalizeValue } from '@/translation/common'
import { translateGroupList } from '@/translation/group'
import { translateLanguageList } from '@/translation/language'
import { translateSeriesList } from '@/translation/series'
import { sortTagValue, translateTag } from '@/translation/tag'
import { Manga, MangaTag } from '@/types/manga'

import { isValidKHentaiTagCategory } from './k-hentai'
import { ProxyClient, ProxyClientConfig } from './proxy'
import { isUpstreamServer5XXError } from './proxy-utils'

type HiyobiImage = {
  height: number
  name: string
  url: string
  width: number
}

type HiyobiManga = {
  artists: HiyobiTag[]
  category: number
  characters: HiyobiTag[]
  comments: number
  count: number
  filecount: number
  groups: HiyobiTag[]
  id: number
  language: string
  like: number
  like_anonymous: number
  parodys: HiyobiTag[]
  tags: HiyobiTag[]
  title: string
  type: number
  uid: number
  uploader: number
  uploadername: string
}

type HiyobiTag = {
  display: string
  value: string
}

const hiyobiTypeNumberToName: Record<number, string> = {
  1: '동인지',
  2: '망가',
  3: '아티스트 CG',
  4: '게임 CG',
  5: '서양',
  6: '이미지 모음',
  7: '건전',
  8: '코스프레',
  9: '아시안',
  10: '기타',
}

const HIYOBI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://api.hiyobi.org',
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
    Referer: 'https://hiyobi.org',
  },
}

const HIYOBI_IMAGE_CONFIG: ProxyClientConfig = {
  baseURL: 'https://api-kh.hiyobi.org',
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
    Referer: 'https://hiyobi.org',
  },
}

export class HiyobiClient {
  private static instance: HiyobiClient
  private readonly client: ProxyClient
  private readonly imageClient: ProxyClient

  // Singleton instance
  private constructor() {
    this.client = new ProxyClient(HIYOBI_CONFIG)
    this.imageClient = new ProxyClient(HIYOBI_IMAGE_CONFIG)
  }

  static getInstance(): HiyobiClient {
    if (!HiyobiClient.instance) {
      HiyobiClient.instance = new HiyobiClient()
    }
    return HiyobiClient.instance
  }

  async fetchManga(
    id: number,
    revalidate = 604800, // 1 week
  ): Promise<Manga> {
    const manga = await this.client.fetch<HiyobiManga>(`/gallery/${id}`, {
      cache: revalidate > 0 ? 'force-cache' : 'no-store',
      next: { revalidate },
    })

    return this.convertHiyobiToManga(manga)
  }

  async fetchMangaImages(id: number): Promise<string[]> {
    const hiyobiImages = await this.imageClient.fetch<HiyobiImage[]>(`/hiyobi/list?id=${id}`, {
      cache: 'force-cache',
      next: { revalidate: 43200 }, // 12 hours
    })

    return hiyobiImages.map((image) => image.url)
  }

  async fetchMangas(
    page: number,
    revalidate = 21600, // 6 hours
  ): Promise<Manga[]> {
    const response = await this.client.fetch<{ list: HiyobiManga[] }>(`/list/${page}`, { next: { revalidate } })

    return response.list.map((manga) => this.convertHiyobiToManga(manga))
  }

  async fetchRandomMangas(): Promise<Manga[] | null> {
    const mangas = await this.client.fetch<HiyobiManga[]>('/random', {
      method: 'POST',
      next: { revalidate: 15 },
    })

    return mangas.map((manga) => this.convertHiyobiToManga(manga))
  }

  private convertHiyobiTagsToTags(hiyobiTags: HiyobiTag[], locale: keyof Multilingual): MangaTag[] {
    return hiyobiTags.map((hTag) => {
      const [category, value] = hTag.value.split(':')

      if (!value) {
        const sortedCategory = sortTagValue(category)
        return {
          category: sortedCategory,
          value: category,
          label: translateTag(sortedCategory, category, locale),
        }
      }

      return {
        category: isValidKHentaiTagCategory(category) ? category : '',
        value: normalizeValue(value),
        label: translateTag(category, value, locale),
      }
    })
  }

  private convertHiyobiToManga({
    id,
    artists,
    characters,
    groups,
    parodys,
    tags,
    title,
    type,
    filecount,
    count,
    like,
    like_anonymous,
    language,
  }: HiyobiManga): Manga {
    const locale = 'ko' // TODO: Get from user preferences or context
    const seriesValues = parodys.map((series) => series.value)
    const artistValues = artists.map((artist) => artist.display)
    const characterValues = characters.map((character) => character.display)
    const groupValues = groups.map((group) => group.display)

    return {
      id,
      artists: translateArtistList(artistValues, locale),
      characters: translateCharacterList(characterValues, locale),
      group: translateGroupList(groupValues, locale),
      series: translateSeriesList(seriesValues, locale),
      tags: this.convertHiyobiTagsToTags(tags, locale),
      title,
      type: hiyobiTypeNumberToName[type] ?? `${type}?`,
      languages: translateLanguageList([language], locale),
      images: [this.getKHentaiThumbnailURL(id)],
      cdn: 'thumb.k-hentai',
      count: filecount,
      like,
      viewCount: count,
      likeAnonymous: like_anonymous,
    }
  }

  private getKHentaiThumbnailURL(id: number): string {
    const millions = Math.floor(id / 1_000_000)
    const thousands = Math.floor((id % 1_000_000) / 1_000)
    const remainder = id % 1000
    return `${millions}/${thousands}/${remainder}`
  }
}
