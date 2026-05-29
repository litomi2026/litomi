import { translateArtistList } from '@litomi/catalog/translation/artist'
import { translateCharacterList } from '@litomi/catalog/translation/character'
import { translateGroupList } from '@litomi/catalog/translation/group'
import { translateLanguageList } from '@litomi/catalog/translation/language'
import { translateSeriesList } from '@litomi/catalog/translation/series'
import { translateTag } from '@litomi/catalog/translation/tag'
import { translateType } from '@litomi/catalog/translation/type'
import { Locale } from '@litomi/domain/locale'
import { MangaSource } from '@litomi/domain/manga/model'
import { Manga, MangaTag } from '@litomi/domain/manga/model'
import ms from 'ms'

import { isUpstreamServerError } from '../core/errors'
import { ProxyClient, ProxyClientConfig } from '../core/proxy'

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

type MangaFetchParams = {
  id: number
  locale: Locale
  revalidate?: number
  signal?: AbortSignal
}

type MangaListFetchParams = {
  page: number
  locale: Locale
  revalidate?: number
  signal?: AbortSignal
}

const hiyobiTypeNumberToName: Record<number, string> = {
  1: 'doujinshi',
  2: 'manga',
  3: 'artist_cg',
  4: 'game_cg',
  5: 'western',
  6: 'image_set',
  7: 'non-h',
  8: 'cosplay',
  9: 'asian',
  10: 'misc',
  11: 'private',
}

const HIYOBI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://api.hiyobi.org',
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
    'accept-encoding': 'gzip, deflate, br, zstd',
    origin: 'https://hiyobi.org',
    referer: 'https://hiyobi.org/',
  },
}

const HIYOBI_IMAGE_CONFIG: ProxyClientConfig = {
  baseURL: 'https://api-kh.hiyobi.org',
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
    'accept-encoding': 'gzip, deflate, br, zstd',
    origin: 'https://hiyobi.org',
    referer: 'https://hiyobi.org',
  },
}

class HiyobiClient {
  private readonly client: ProxyClient
  private readonly imageClient: ProxyClient

  constructor() {
    this.client = new ProxyClient(HIYOBI_CONFIG)
    this.imageClient = new ProxyClient(HIYOBI_IMAGE_CONFIG)
  }

  async fetchManga({ id, locale, revalidate, signal }: MangaFetchParams) {
    const manga = await this.client.fetch<HiyobiManga>(`/gallery/${id}`, {
      next: { revalidate },
      signal,
    })

    if (!manga.id) {
      return null
    }

    return this.convertHiyobiToManga(manga, locale)
  }

  async fetchMangaImages({ id, revalidate, signal }: { id: number; revalidate?: number; signal?: AbortSignal }) {
    const hiyobiImages = await this.imageClient.fetch<HiyobiImage[]>(`/hiyobi/list?id=${id}`, {
      next: { revalidate },
      signal,
    })

    return hiyobiImages.map((image) => image.url)
  }

  async fetchMangas({ page, locale, revalidate, signal }: MangaListFetchParams) {
    const response = await this.client.fetch<{ list: HiyobiManga[] }>(`/list/${page}`, {
      next: { revalidate },
      signal,
    })
    return response.list.filter((manga) => manga.id).map((manga) => this.convertHiyobiToManga(manga, locale))
  }

  async fetchRandomMangas({
    locale,
    revalidate,
    signal,
  }: {
    locale: Locale
    revalidate?: number
    signal?: AbortSignal
  }) {
    const mangas = await this.client.fetch<HiyobiManga[]>('/random', {
      method: 'POST',
      next: { revalidate },
      signal,
    })

    return mangas.map((manga) => this.convertHiyobiToManga(manga, locale))
  }

  private convertHiyobiTagsToTags(hiyobiTags: HiyobiTag[], locale: Locale): MangaTag[] {
    return hiyobiTags.map((hTag) => {
      const [category, value] = hTag.value.split(':')

      if (!value) {
        return translateTag('other', category, locale)
      }

      return translateTag(category, value, locale)
    })
  }

  private convertHiyobiToManga(manga: HiyobiManga, locale: Locale): Manga {
    const {
      id,
      title,
      type,
      filecount,
      count,
      like,
      like_anonymous,
      language,
      parodys,
      artists,
      characters,
      groups,
      tags,
    } = manga

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
      title: title === '정보없음' ? '' : title,
      type: translateType(hiyobiTypeNumberToName[type] ?? `${type}?`, locale),
      languages: translateLanguageList([language], locale),
      images: [{ thumbnail: { url: this.getKHentaiThumbnailURL(id) } }],
      count: filecount,
      like,
      viewCount: count,
      likeAnonymous: like_anonymous,
      source: MangaSource.HIYOBI,
    }
  }

  private getKHentaiThumbnailURL(id: number): string {
    const millions = Math.floor(id / 1_000_000)
    const thousands = Math.floor((id % 1_000_000) / 1_000)
    const remainder = id % 1000
    return `https://khentai-t.siam-cdn.net/${millions}/${thousands}/${remainder}`
  }
}

// Singleton instance
export const hiyobiClient = new HiyobiClient()
