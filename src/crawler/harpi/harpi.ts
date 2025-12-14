import initCycleTLS, { CycleTLSClient } from 'cycletls'
import fs from 'fs'
import ms from 'ms'
import os from 'os'
import path from 'path'
import { brotliDecompressSync, gunzipSync, inflateSync } from 'zlib'

import { GETHarpiSearchRequest, HarpiSearchSchema } from '@/app/api/proxy/harpi/search/schema'
import { HARPI_TAG_MAP } from '@/crawler/harpi/tag'
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

import { UpstreamServerError } from '../errors'

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

const HARPI_BASE_URL = 'https://harpi.in'
const REQUEST_TIMEOUT = ms('10 seconds')
const CYCLETLS_INIT_TIMEOUT = ms('5 seconds')

// Chrome 131 User-Agent
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// Chrome 131 JA3 fingerprint
const CHROME_JA3 =
  '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0'

// NOTE: Prefer lowercase header keys (HTTP/2 behavior) to reduce fingerprint drift.
const DEFAULT_HEADERS = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  // Browsers typically send this; it can affect bot detection heuristics.
  'accept-encoding': 'gzip, deflate, br',
  origin: 'https://harpi.in',
  referer: 'https://harpi.in/',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  // Chrome sometimes adds this header (esp. in HTTP/2); harmless if ignored.
  priority: 'u=1, i',
} as const

const DEFAULT_HEADER_ORDER = Object.keys(DEFAULT_HEADERS)

class HarpiClient {
  private cycleTLSClient: CycleTLSClient | null = null
  private initPromise: Promise<CycleTLSClient> | null = null

  async fetchManga({ id, locale }: MangaFetchParams): Promise<Manga | null> {
    const validatedParams = HarpiSearchSchema.parse({ ids: [id] })
    const searchParams = this.buildSearchParams(validatedParams)

    const response = await this.fetch<HarpiListResponse>(`/animation/list?${searchParams}`)

    if (response.data.length === 0) {
      return null
    }

    return this.convertHarpiToManga(response.data[0], locale)
  }

  async fetchMangaByHarpiId({ id, locale }: MangaFetchParams): Promise<Manga> {
    const response = await this.fetch<{ data: HarpiManga }>(`/animation/${id}`)

    return this.convertHarpiToManga(response.data, locale)
  }

  async searchMangas(params: Partial<GETHarpiSearchRequest> = {}, locale: Locale) {
    const validatedParams = HarpiSearchSchema.parse(params)
    const searchParams = this.buildSearchParams(validatedParams)

    const response = await this.fetch<HarpiListResponse>(`/animation/list?${searchParams}`)

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

  private async fetch<T>(path: string): Promise<T> {
    const client = await this.getClient()
    const url = `${HARPI_BASE_URL}${path}`

    const response = await client(
      url,
      {
        headers: DEFAULT_HEADERS,
        headerOrder: DEFAULT_HEADER_ORDER,
        orderAsProvided: true,
        ja3: CHROME_JA3,
        userAgent: USER_AGENT,
        proxy: process.env.HARPI_PROXY_URL || undefined,
        timeout: REQUEST_TIMEOUT,
      },
      'get',
    )

    if (response.status !== 200) {
      const headers = (response.headers ?? {}) as Record<string, unknown>
      const contentEncoding = getHeaderValue(headers, 'content-encoding')
      const contentType = getHeaderValue(headers, 'content-type')
      const cfRay = getHeaderValue(headers, 'cf-ray')
      const server = getHeaderValue(headers, 'server')

      const decodedBody = decodeResponseBody(response.data, contentEncoding) ?? ''
      const bodyPreview = decodedBody.replace(/\s+/g, ' ').slice(0, 600)

      // NOTE: console.log may be stripped in production; keep this as error for Vercel logs.
      console.error('[harpi] Upstream error', {
        status: response.status,
        url,
        finalUrl: response.finalUrl,
        cfRay,
        server,
        contentEncoding,
        contentType,
        bodyPreview,
      })

      throw new UpstreamServerError(`HTTP ${response.status}`, response.status, {
        url,
        body: response.data,
        bodyTextPreview: bodyPreview,
        headers,
        finalUrl: response.finalUrl,
        contentEncoding,
        contentType,
      })
    }

    // cycletls returns data as string | object | Buffer
    const data =
      typeof response.data === 'string'
        ? JSON.parse(response.data)
        : Buffer.isBuffer(response.data)
          ? JSON.parse(decodeResponseBody(response.data, getHeaderValue(response.headers as Record<string, unknown>, 'content-encoding')) ?? '{}')
          : response.data
    return data as T
  }

  private async getClient(): Promise<CycleTLSClient> {
    if (this.cycleTLSClient) {
      return this.cycleTLSClient
    }

    if (!this.initPromise) {
      const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined
        try {
          return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
            }),
          ])
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
        }
      }

      // Determine correct executable path based on platform and architecture
      const platform = os.platform()
      const arch = os.arch()
      let executableName = 'index'

      if (platform === 'darwin') {
        executableName = arch === 'arm64' ? 'index-mac-arm64' : 'index-mac'
      } else if (platform === 'linux') {
        // Vercel Serverless Functions commonly run on Linux x64 (arch === 'x64')
        // cycletls provides:
        // - index        : linux x64
        // - index-arm    : linux arm (32-bit)
        // - index-arm64  : linux arm64
        if (arch === 'arm64') {
          executableName = 'index-arm64'
        } else if (arch.startsWith('arm')) {
          executableName = 'index-arm'
        } else {
          executableName = 'index'
        }
      } else if (platform === 'win32') {
        executableName = 'index.exe'
      } else if (platform === 'freebsd') {
        executableName = 'index-freebsd'
      }

      // Use process.cwd() for Next.js/Turbopack compatibility
      const executablePath = path.join(process.cwd(), 'node_modules', 'cycletls', 'dist', executableName)

      if (!fs.existsSync(executablePath)) {
        // NOTE: console.log may be stripped in production builds; use warn/error for debugging.
        console.error('[harpi] CycleTLS executable not found', { platform, arch, executableName, executablePath })
        throw new Error(`CycleTLS executable not found: ${executableName} (${platform}/${arch})`)
      }

      this.initPromise = withTimeout(
        initCycleTLS({ executablePath }).then((client) => {
          this.cycleTLSClient = client
          return client
        }),
        CYCLETLS_INIT_TIMEOUT,
        `CycleTLS init timed out after ${CYCLETLS_INIT_TIMEOUT}ms (${platform}/${arch}, ${executableName})`,
      ).catch((error) => {
        // Allow retry on next request if init failed
        this.initPromise = null
        throw error
      })
    }

    return this.initPromise
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

function decodeResponseBody(data: unknown, contentEncoding?: string): string | undefined {
  if (typeof data === 'string') return data
  if (!data) return undefined

  const decodeBuffer = (buf: Buffer) => {
    const encoding = (contentEncoding ?? '').toLowerCase()
    let out = buf

    // Prefer declared encoding
    try {
      if (encoding.includes('br')) out = brotliDecompressSync(out)
      else if (encoding.includes('gzip')) out = gunzipSync(out)
      else if (encoding.includes('deflate')) out = inflateSync(out)
    } catch {
      // Best-effort fallback when header is missing/incorrect
      const fns = [brotliDecompressSync, gunzipSync, inflateSync] as const
      for (const fn of fns) {
        try {
          out = fn(buf)
          break
        } catch {
          // keep trying
        }
      }
    }

    try {
      return out.toString('utf8')
    } catch {
      return undefined
    }
  }

  if (Buffer.isBuffer(data)) {
    return decodeBuffer(data)
  }

  // Handle Buffer-like JSON structure (e.g. when serialized)
  if (typeof data === 'object' && (data as { type?: unknown }).type === 'Buffer' && Array.isArray((data as { data?: unknown }).data)) {
    return decodeBuffer(Buffer.from((data as { data: number[] }).data))
  }

  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

function getHeaderValue(headers: Record<string, unknown> | undefined, name: string): string | undefined {
  if (!headers) return undefined
  const target = name.toLowerCase()

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== target) continue

    if (Array.isArray(value)) {
      const first = value[0]
      if (typeof first === 'string') return first
      if (first === null || first === undefined) return undefined
      return String(first)
    }

    if (typeof value === 'string') return value
    if (value === null || value === undefined) return undefined
    return String(value)
  }

  return undefined
}

// Singleton instance
export const harpiClient = new HarpiClient()
