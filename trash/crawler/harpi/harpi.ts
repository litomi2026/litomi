import ms from 'ms'

import { MangaSource, tagCategoryNameToInt } from '@/database/enum'
import { translateArtistList } from '@/translation/artist'
import { translateCharacterList } from '@/translation/character'
import { Locale, Multilingual } from '@/translation/common'
import { translateLanguageList } from '@/translation/language'
import { translateSeriesList } from '@/translation/series'
import { translateTag } from '@/translation/tag'
import { translateType } from '@/translation/type'
import { Manga, MangaTag } from '@/types/manga'
import { uniqBy } from '@/utils/array'

import { ProxyClient, ProxyClientConfig } from '../../../src/crawler/proxy'
import { isUpstreamServerError } from '../../../src/crawler/proxy-utils'
import { GETHarpiSearchRequest, HarpiSearchSchema } from '../../api/harpi/search/schema'
import { HARPI_TAG_MAP } from './tag'

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
  authors?: string[]
  series?: string[]
  tagsIds?: string[]
  characters?: string[]
  views: number
  bookmarks: number
  sumRating: number
  meanRating: number
  countRating: number
  date: string
  imageUrl?: string[]
  imageCount?: number
  isUserDirectUpload: boolean
  uploader: string
  authorsLikesId: string[]
  textSummary: string
  memorableQuote: string[]
}

type MangaFetchParams = {
  id: number | string
  locale: Locale
  revalidate?: number
}

const HARPI_MANGA_TYPE_MAP: Record<string, string> = {
  동인지: 'doujinshi',
  만화: 'manga',
  아티스트CG: 'artist_cg',
  이미지모음: 'image_set',
}

const HARPI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://harpi.in',
  circuitBreaker: {
    failureThreshold: 5,
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
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    Origin: 'https://harpi.in',
    Pragma: 'no-cache',
    Referer: 'https://harpi.in/',
    'Sec-CH-UA': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  },
}

class HarpiClient {
  private readonly client: ProxyClient

  constructor() {
    this.client = new ProxyClient(HARPI_CONFIG)
  }

  async fetchManga({ id, revalidate, locale }: MangaFetchParams): Promise<Manga | null> {
    const validatedParams = HarpiSearchSchema.parse({ ids: [id] })
    const searchParams = this.buildSearchParams(validatedParams)

    const response = await this.client.fetch<HarpiListResponse>(`/animation/list?${searchParams}`, {
      next: { revalidate },
    })

    if (response.data.length === 0) {
      return null
    }

    return this.convertHarpiToManga(response.data[0], locale)
  }

  async fetchMangaByHarpiId({ id, revalidate, locale }: MangaFetchParams): Promise<Manga> {
    const response = await this.client.fetch<{ data: HarpiManga }>(`/animation/${id}`, {
      next: { revalidate },
    })

    return this.convertHarpiToManga(response.data, locale)
  }

  fetchMangaImages(id: number, count: number): string[] {
    return Array.from({ length: count }, (_, i) => `https://soujpa.in/start/${id}/${id}_${i}.avif`)
  }

  async searchMangas(params: Partial<GETHarpiSearchRequest> = {}, locale: Locale, revalidate?: number) {
    const validatedParams = HarpiSearchSchema.parse(params)
    const searchParams = this.buildSearchParams(validatedParams)

    const response = await this.client.fetch<HarpiListResponse>(`/animation/list?${searchParams}`, {
      next: { revalidate },
    })

    if (response.data.length === 0) {
      return null
    }

    return response.data.map((manga) => this.convertHarpiToManga(manga, locale))
  }

  private buildSearchParams(params: GETHarpiSearchRequest): URLSearchParams {
    const searchParams = new URLSearchParams()

    function normalizeStringArray(value: string[]) {
      const result = []

      for (const v of value) {
        const trimmed = v.trim()
        if (trimmed.length > 0) {
          result.push(trimmed)
        }
      }

      return result.sort()
    }

    function appendMultipleValues(key: string, value: number | string | number[] | string[]) {
      let normalizedValues: (number | string)[]

      if (Array.isArray(value)) {
        normalizedValues = value.sort()
      } else {
        normalizedValues = normalizeStringArray(value.toString().split(','))
      }

      for (const v of normalizedValues) {
        searchParams.append(key, v.toString())
      }
    }

    if (params.searchText) {
      const searchTerms = normalizeStringArray(params.searchText.split(' '))

      for (const term of searchTerms) {
        searchParams.append('searchText', term)
      }
    }

    if (params.lineText) {
      const lineTexts = normalizeStringArray(params.lineText.split(' '))

      for (const text of lineTexts) {
        searchParams.append('lineText', text)
      }
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

  private convertHarpiTagIdsToTags(tagIds: string[], locale: keyof Multilingual): MangaTag[] {
    const sortedTags = tagIds
      .map((tagId) => {
        const tagInfo = HARPI_TAG_MAP[tagId]

        if (!tagInfo) {
          return null
        }

        const enTag = tagInfo.en
        const colonIndex = enTag.indexOf(':')

        if (colonIndex === -1) {
          return translateTag('other', enTag, locale)
        }

        const categoryStr = enTag.substring(0, colonIndex)
        const value = enTag.substring(colonIndex + 1)

        let category: MangaTag['category']
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

        return translateTag(category, value, locale)
      })
      .filter((tag): tag is MangaTag => Boolean(tag))
      // NOTE: 기본적으로 정렬되지 않음
      .sort((a, b) => {
        if (a.category === b.category) {
          return a.label.localeCompare(b.label)
        }
        return tagCategoryNameToInt[a.category] - tagCategoryNameToInt[b.category]
      })

    // NOTE: female:incest, male:incest, other:incest -> mixed:incest x3 중복 제거
    return uniqBy(sortedTags, 'label')
  }

  private convertHarpiToManga(harpiManga: HarpiManga, locale: Locale): Manga {
    const {
      id,
      parseKey,
      title,
      engTitle,
      korTitle,
      type,
      authors,
      characters,
      series,
      tagsIds,
      date,
      imageUrl,
      imageCount,
      views,
      meanRating,
      countRating,
      bookmarks,
      textSummary,
      memorableQuote,
    } = harpiManga

    const mangaId = parseInt(parseKey, 10) || 0

    return {
      id: mangaId,
      harpiId: id,
      title: korTitle || engTitle || title,
      artists: translateArtistList(authors, locale),
      characters: translateCharacterList(characters, locale),
      description: textSummary,
      series: translateSeriesList(series, locale),
      lines: memorableQuote,
      tags: tagsIds ? this.convertHarpiTagIdsToTags(tagsIds, locale) : [],
      type: translateType(HARPI_MANGA_TYPE_MAP[type] ?? `${type}?`, locale),
      languages: translateLanguageList(['korean'], locale),
      date: new Date(date).toISOString(),
      images: imageUrl
        ? this.sortImageURLs(imageUrl).map((pathname) => ({
            original: { url: `https://soujpa.in/start/${pathname}` },
          }))
        : Array(imageCount)
            .fill('')
            .map((_, index) => ({ original: { url: `https://soujpa.in/start/${mangaId}/${mangaId}_${index}.avif` } })),
      viewCount: views,
      count: imageCount,
      rating: meanRating,
      ratingCount: countRating,
      bookmarkCount: bookmarks,
      source: MangaSource.HARPI,
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
  private sortImageURLs(urls: string[]): string[] {
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

// Singleton instance
export const harpiClient = new HarpiClient()
