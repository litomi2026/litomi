import {
  GETHarpiSearchRequest,
  HarpiComicKind,
  HarpiListMode,
  HarpiRandomMode,
  HarpiSort,
} from '@/app/api/proxy/harpi/search/schema'
import { HARPI_TAG_MAP } from '@/database/harpi-tag'
import { Multilingual, translateTag } from '@/database/tag-translations'
import { Manga, Tag } from '@/types/manga'

import { ProxyClient, ProxyClientConfig } from './proxy'
import { isUpstreamServer5XXError } from './proxy-utils'

type HarpiListResponse = {
  alert: string
  data: HarpiManga[]
  totalCount: number
}

type HarpiManga = {
  id: string
  parseKey: string
  title: string
  engTitle: string
  korTitle: string
  type: string
  authors: string[]
  series: string[]
  tagsIds?: string[]
  characters: string[]
  views: number
  bookmarks: number
  sumRating: number
  meanRating: number
  countRating: number
  date: string
  imageUrl: string[]
  isUserDirectUpload: boolean
  uploader: string
  authorsLikesId: string[]
  textSummary: string
  memorableQuote: string[]
}

const HARPI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://harpi.in',
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
    Accept: 'application/json',
    'Accept-Language': 'ko-KR,ko;q=0.9,zh-CN;q=0.8,zh;q=0.7,ja;q=0.6,sm;q=0.5,en;q=0.4',
    Origin: 'https://harpi.in/',
    Referer: 'https://harpi.in/',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  },
}

export class HarpiClient {
  private static instance: HarpiClient
  private readonly client: ProxyClient

  // Singleton instance
  private constructor() {
    this.client = new ProxyClient(HARPI_CONFIG)
  }

  static getInstance(): HarpiClient {
    if (!HarpiClient.instance) {
      HarpiClient.instance = new HarpiClient()
    }
    return HarpiClient.instance
  }

  async fetchMangaByHarpiId(harpiId: string): Promise<Manga> {
    const response = await this.client.fetch<{ data: HarpiManga }>(`/animation/${harpiId}`, {
      cache: 'force-cache',
      next: { revalidate: 43200 }, // 12 hours
    })

    return this.convertHarpiToManga(response.data)
  }

  async fetchMangas(
    params: GETHarpiSearchRequest = {
      comicKind: HarpiComicKind.EMPTY,
      isIncludeTagsAnd: true,
      minImageCount: 0,
      maxImageCount: 0,
      listMode: HarpiListMode.SORT,
      randomMode: HarpiRandomMode.SEARCH,
      page: 0,
      pageLimit: 10,
      sort: HarpiSort.DATE_DESC,
    },
    revalidate = 0,
  ): Promise<Manga[]> {
    const searchParams = this.buildSearchParams(params)

    const response = await this.client.fetch<HarpiListResponse>(`/animation/list?${searchParams}`, {
      cache: revalidate > 0 ? 'force-cache' : 'no-store',
      next: { revalidate },
    })

    return response.data.map((manga) => this.convertHarpiToManga(manga))
  }

  private buildImageUrls(imageUrls: string[]): string[] {
    return this.sortImageUrls(imageUrls).map((url) => `https://soujpa.in/start/${url}`)
  }

  private buildSearchParams(params: GETHarpiSearchRequest): URLSearchParams {
    const searchParams = new URLSearchParams()

    const appendMultipleValues = (key: string, value: number | string | number[] | string[]) => {
      const values = Array.isArray(value)
        ? value
        : value
            .toString()
            .split(',')
            .map((v) => v.trim())
      values.forEach((v) => searchParams.append(key, v.toString()))
    }

    if (params.searchText) {
      const searchTerms = params.searchText.split(' ').filter((term) => term.trim())
      searchTerms.forEach((term) => searchParams.append('searchText', term))
    }

    if (params.lineText) {
      const lineTexts = params.lineText.split(' ').filter((text) => text.trim())
      lineTexts.forEach((text) => searchParams.append('lineText', text))
    }

    if (params.authors) appendMultipleValues('selectedAuthors', params.authors)
    if (params.groups) appendMultipleValues('selectedGroups', params.groups)
    if (params.series) appendMultipleValues('selectedSeries', params.series)
    if (params.characters) appendMultipleValues('selectedCharacters', params.characters)
    if (params.tags) appendMultipleValues('includeTags', params.tags)
    if (params.tagsExclude) appendMultipleValues('excludeTags', params.tagsExclude)
    if (params.ids) appendMultipleValues('parseKeys', params.ids)

    searchParams.append('comicKind', params.comicKind ?? 'EMPTY')
    searchParams.append('isIncludeTagsAnd', params.isIncludeTagsAnd?.toString() ?? 'false')
    searchParams.append('minImageCount', params.minImageCount?.toString() ?? '0')
    searchParams.append('maxImageCount', params.maxImageCount?.toString() ?? '0')
    searchParams.append('listMode', params.listMode ?? 'sort')
    searchParams.append('randomMode', params.randomMode ?? 'search')
    searchParams.append('page', params.page?.toString() ?? '0')
    searchParams.append('pageLimit', params.pageLimit?.toString() ?? '10')
    searchParams.append('sort', params.sort ?? 'date_desc')

    return searchParams
  }

  private convertHarpiTagIdsToTags(tagIds: string[], locale: keyof Multilingual): Tag[] {
    return tagIds
      .map((tagId) => {
        const tagInfo = HARPI_TAG_MAP[tagId]

        if (!tagInfo) {
          return {
            category: '',
            value: tagId,
            label: tagId,
          }
        }

        const enTag = tagInfo.en
        const colonIndex = enTag.indexOf(':')

        if (colonIndex === -1) {
          return {
            category: 'other',
            value: enTag,
            label: translateTag('other', enTag, locale),
          }
        }

        const categoryStr = enTag.substring(0, colonIndex)
        const value = enTag.substring(colonIndex + 1)

        let category: Tag['category']
        switch (categoryStr) {
          case 'etc':
            category = 'other'
            break
          case 'female':
          case 'male':
          case 'mixed':
          case 'other':
            category = categoryStr
            break
          default:
            category = ''
        }

        return {
          category,
          value,
          label: translateTag(category, value, locale),
        }
      })
      .filter((tag): tag is Tag => Boolean(tag))
  }

  private convertHarpiToManga(harpiManga: HarpiManga): Manga {
    const locale: keyof Multilingual = 'ko' // TODO: Get from user preferences or context

    return {
      id: parseInt(harpiManga.parseKey, 10) || 0,
      harpiId: harpiManga.id,
      title: harpiManga.korTitle || harpiManga.engTitle || harpiManga.title,
      artists: harpiManga.authors,
      characters: harpiManga.characters,
      series: harpiManga.series,
      tags: harpiManga.tagsIds ? this.convertHarpiTagIdsToTags(harpiManga.tagsIds, locale) : [],
      type: harpiManga.type,
      language: 'korean',
      images: this.buildImageUrls(harpiManga.imageUrl),
      cdn: 'harpi',
      count: harpiManga.imageUrl.length,
      date: harpiManga.date,
      viewCount: harpiManga.views,
      rating: harpiManga.meanRating,
    }
  }

  /**
   * Sorts image URLs by extracting numeric parts from filenames
   * Supports multiple patterns like:
   * - image_123.jpg
   * - image-123.png
   * - 123.webp
   * - image123.gif
   * - image_001_final.jpg
   */
  private sortImageUrls(urls: string[]): string[] {
    return urls.slice().sort((a, b) => {
      const patterns = [
        // Matches: _123.ext, -123.ext, .123.ext
        /[_\-.](\d+)\.(\w+)$/,
        // Matches: _123_something.ext, -123-something.ext
        // Using [^.]* instead of .* to prevent backtracking past the extension
        /[_\-.](\d+)[_\-.]([^.]*)\.(\w+)$/,
        // Matches: 123.ext at the beginning
        /^(\d+)\.(\w+)$/,
        // Matches: something123.ext (number right before extension)
        // Safe pattern: captures last sequence of digits before extension
        /(\d+)(?=\.\w+$)/,
        // Matches: any sequence of digits in the filename
        /(\d+)/,
      ]

      let numA = 0
      let numB = 0

      for (const pattern of patterns) {
        const matchA = a.match(pattern)
        const matchB = b.match(pattern)

        if (matchA && matchB) {
          numA = parseInt(matchA[1], 10)
          numB = parseInt(matchB[1], 10)
          break
        } else if (matchA && !matchB) {
          return -1
        } else if (!matchA && matchB) {
          return 1
        }
      }

      if (numA !== 0 || numB !== 0) {
        return numA - numB
      }

      // Fallback to string comparison if no numbers found
      return a.localeCompare(b, undefined, { numeric: true })
    })
  }
}
