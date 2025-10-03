import ms from 'ms'

import { MangaSource } from '@/database/enum'
import { translateArtistList } from '@/translation/artist'
import { translateCharacterList } from '@/translation/character'
import { Multilingual } from '@/translation/common'
import { translateGroupList } from '@/translation/group'
import { translateLanguageList } from '@/translation/language'
import { translateSeriesList } from '@/translation/series'
import { translateTag } from '@/translation/tag'
import { Manga, MangaTag } from '@/types/manga'
import { sec } from '@/utils/date'

import { ProxyClient, ProxyClientConfig } from './proxy'
import { isUpstreamServerError } from './proxy-utils'

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
  11: '비공개',
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

  async fetchManga({ id, revalidate = sec('1 week') }: { id: number; revalidate?: number }) {
    const manga = await this.client.fetch<HiyobiManga>(`/gallery/${id}`, {
      next: { revalidate },
    })

    if (!manga.id) {
      return null
    }

    return this.convertHiyobiToManga(manga)
  }

  async fetchMangaImages({ id, revalidate = sec('12 hours') }: { id: number; revalidate?: number }) {
    const hiyobiImages = await this.imageClient.fetch<HiyobiImage[]>(`/hiyobi/list?id=${id}`, {
      next: { revalidate },
    })

    return hiyobiImages.map((image) => image.url)
  }

  async fetchMangas({ page, revalidate = sec('6 hours') }: { page: number; revalidate?: number }) {
    const response = await this.client.fetch<{ list: HiyobiManga[] }>(`/list/${page}`, { next: { revalidate } })
    return response.list.filter((manga) => manga.id).map((manga) => this.convertHiyobiToManga(manga))
  }

  async fetchRandomMangas() {
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
        return translateTag('other', category, locale)
      }

      return translateTag(category, value, locale)
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
      title: title === '정보없음' ? '' : title,
      type: hiyobiTypeNumberToName[type] ?? `${type}?`,
      languages: translateLanguageList([language], locale),
      images: [this.getKHentaiThumbnailURL(id)],
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
    return `https://thumb.k-hentai.org/${millions}/${thousands}/${remainder}`
  }
}

// Singleton instance
export const hiyobiClient = new HiyobiClient()
