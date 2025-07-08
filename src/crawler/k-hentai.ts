import { normalizeTagValue, translateTag } from '@/database/tag-translations'
import { Manga } from '@/types/manga'
import { convertCamelCaseToKebabCase } from '@/utils/param'

import { ParseError } from './errors'
import { ProxyClient, ProxyClientConfig } from './proxy'
import { isUpstreamServer5XXError } from './proxy-utils'

const kHentaiTypeNumberToName: Record<number, string> = {
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
  11: '비공개',
}

const typeNameToNumber: Record<string, number> = {
  동인지: 1,
  doujinshi: 1,
  망가: 2,
  manga: 2,
  아티스트cg: 3,
  아티스트_cg: 3,
  artistcg: 3,
  artist_cg: 3,
  게임cg: 4,
  게임_cg: 4,
  game_cg: 4,
  gamecg: 4,
  서양: 5,
  western: 5,
  이미지모음: 6,
  이미지_모음: 6,
  imageset: 6,
  image_set: 6,
  건전: 7,
  'non-h': 7,
  코스프레: 8,
  cosplay: 8,
  아시안: 9,
  asian: 9,
  기타: 10,
  other: 10,
  misc: 10,
  비공개: 11,
  private: 11,
}

const VALID_TAG_CATEGORIES = ['female', 'male', 'mixed', 'other'] as const

export interface File {
  id: string
  image: Image
  name: string
  thumbnail: Thumbnail
}

export interface Image {
  extension: string
  height: number
  id: string
  orientation: string
  server: number
  size: number
  url: string
  width: number
}

export interface KHentaiGallery extends KHentaiMangaCommon {
  files: File[]
}

export interface KHentaiManga extends KHentaiMangaCommon {
  torrents: Torrent[]
}

export interface Thumbnail {
  extension: string
  height: number
  id: string
  orientation: string
  server: number
  size: number
  url: string
  width: number
}

interface KHentaiMangaCommon {
  archived: number
  blocked: number
  category: number
  current_gid: number
  current_key: number
  expunged: number
  filecount: number
  filesize: number
  first_gid: number
  first_key: string
  id: number
  parent_gid: number
  parent_key: string
  posted: number
  rating: number
  tags: KHentaiTag[]
  thumb: string
  thumb_extension: string
  title: string
  title_jpn: string
  token: string
  torrentcount: number
  updated: number
  uploader: string
  views: number
}

interface KHentaiTag {
  id: number
  tag: [string, string] // e.g. ['female', 'big_breasts']
}

type TagCategory = (typeof VALID_TAG_CATEGORIES)[number]

interface Torrent {
  added: number
  fsize: number
  hash: string
  name: string
  tsize: number
}

const K_HENTAI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://k-hentai.org',
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
    Referer: 'https://k-hentai.org',
  },
}

export class KHentaiClient {
  private static instance: KHentaiClient
  private readonly client: ProxyClient

  // Singleton instance
  private constructor() {
    this.client = new ProxyClient(K_HENTAI_CONFIG)
  }

  static getInstance(): KHentaiClient {
    if (!KHentaiClient.instance) {
      KHentaiClient.instance = new KHentaiClient()
    }
    return KHentaiClient.instance
  }

  async fetchManga(
    id: number,
    revalidate = 43200, // 12 hours
  ): Promise<Manga> {
    const gallery = await this.fetchGallery(id, revalidate)

    return {
      ...this.convertKHentaiCommonToManga(gallery),
      images: gallery.files.map((file) => file.image.url),
    }
  }

  async fetchMangaImages(id: number): Promise<string[]> {
    const gallery = await this.fetchGallery(id)
    return gallery.files.map((file) => file.image.url)
  }

  async fetchRandomKoreanMangas(): Promise<Manga[]> {
    return this.searchMangas({ search: 'language:korean', sort: 'random' }, 15)
  }

  async searchKoreanMangas(
    params?: {
      nextId?: string
      sort?: string
      offset?: string
    },
    revalidate = 21600, // 6 hours
  ): Promise<Manga[]> {
    return this.searchMangas({ search: 'language:korean', ...params }, revalidate)
  }

  async searchMangas(
    params: {
      search?: string
      nextId?: string
      sort?: string
      offset?: string
      categories?: string
      minViews?: string
      maxViews?: string
      minPages?: string
      maxPages?: string
      startDate?: string
      endDate?: string
    },
    revalidate = 21600, // 6 hours
  ): Promise<Manga[]> {
    const kebabCaseParams = Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [convertCamelCaseToKebabCase(key), value])

    const searchParams = new URLSearchParams(kebabCaseParams)

    const data = await this.client.fetch<KHentaiManga[]>(`/ajax/search?${searchParams}`, { next: { revalidate } })

    return data
      .filter((manga) => manga.archived === 1)
      .map((manga) => ({
        ...this.convertKHentaiCommonToManga(manga),
        images: [manga.thumb],
      }))
  }

  private convertKHentaiCommonToManga(manga: KHentaiMangaCommon) {
    const locale = 'ko' // TODO: Get from user preferences or context

    return {
      id: manga.id,
      artists: manga.tags.filter(({ tag }) => tag[0] === 'artist').map(({ tag }) => tag[1]),
      date: new Date(manga.posted * 1000).toString(),
      group: manga.tags.filter(({ tag }) => tag[0] === 'group').map(({ tag }) => tag[1]),
      series: manga.tags.filter(({ tag }) => tag[0] === 'parody').map(({ tag }) => tag[1]),
      tags: manga.tags.filter(this.isValidKHentaiTag).map(({ tag: [category, value] }) => ({
        category,
        value: normalizeTagValue(value),
        label: translateTag(category, value, locale),
      })),
      title: manga.title,
      type: kHentaiTypeNumberToName[manga.category] ?? '?',
      language: manga.tags.find(({ tag }) => tag[0] === 'language')?.tag[1],
      cdn: 'ehgt.org',
      count: manga.filecount,
      rating: manga.rating / 100,
      viewCount: manga.views,
    }
  }

  private async fetchGallery(id: number, revalidate = 43200): Promise<KHentaiGallery> {
    const html = await this.client.fetch<string>(
      `/r/${id}`,
      {
        next: { revalidate },
        headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      },
      true,
    )

    return this.parseGalleryFromHTML(html, id)
  }

  // NOTE: k-hentai에서 언어, 그룹, 패러디 등의 값도 태그로 내려줘서, 진짜 태그만 추출하기 위한 함수
  private isValidKHentaiTag(tag: KHentaiTag): tag is { id: number; tag: [TagCategory, string] } {
    return isValidKHentaiTagCategory(tag.tag[0])
  }

  private parseGalleryFromHTML(html: string, id: number): KHentaiGallery {
    const match = html.match(/const\s+gallery\s*=\s*(\{[\s\S]*?\});/s)

    if (!match) {
      throw new ParseError('k-hentai: `gallery` 변수를 찾을 수 없어요.', { mangaId: id })
    }

    try {
      return JSON.parse(match[1]) as KHentaiGallery
    } catch (error) {
      throw new ParseError('k-hentai: `gallery` 변수를 읽을 수 없어요.', {
        mangaId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

export function getCategories(query?: string) {
  const typeMatch = query?.match(/\btype:(\S+)/i)
  if (!typeMatch) return

  return typeMatch[1]
    .split(',')
    .map((value) => {
      const normalized = value.trim().toLowerCase().replace(/\s+/g, '')
      return /^\d+$/.test(normalized) ? normalized : (typeNameToNumber[normalized] ?? value)
    })
    .filter(Boolean)
    .join(',')
}

export function isValidKHentaiTagCategory(category: string): category is TagCategory {
  return VALID_TAG_CATEGORIES.includes(category as TagCategory)
}
