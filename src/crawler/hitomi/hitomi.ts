import { MangaSource } from '@/database/enum'
import { translateArtistList } from '@/translation/artist'
import { translateCharacterList } from '@/translation/character'
import { translateGroupList } from '@/translation/group'
import { translateLanguageList } from '@/translation/language'
import { translateSeriesList } from '@/translation/series'
import { translateTag } from '@/translation/tag'
import { Manga, MangaTagCategory } from '@/types/manga'
import { sec } from '@/utils/date'

import { NotFoundError, ParseError } from '../errors'
import { ProxyClient, ProxyClientConfig } from '../proxy'
import { isUpstreamServer5XXError } from '../proxy-utils'
import { HitomiFile, HitomiGallery, Tag } from './types'
import { urlFromUrlFromHash } from './utils'

const HITOMI_CONFIG: ProxyClientConfig = {
  baseURL: 'https://ltn.gold-usergeneratedcontent.net',
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
    'accept-encoding': 'gzip, deflate, br, zstd',
    Origin: 'https://hitomi.la',
    Referer: 'https://hitomi.la/',
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.183 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  },
}

export class HitomiClient {
  private static instance: HitomiClient
  private readonly client: ProxyClient

  private constructor() {
    this.client = new ProxyClient(HITOMI_CONFIG)
  }

  static getInstance(): HitomiClient {
    if (!HitomiClient.instance) {
      HitomiClient.instance = new HitomiClient()
    }
    return HitomiClient.instance
  }

  async fetchManga(id: number, revalidate = sec('1 day')) {
    try {
      const jsText = await this.client.fetch<string>(`/galleries/${id}.js`, { next: { revalidate } }, true)
      const gallery = await this.parseGalleryFromJS(jsText, id)
      return await this.convertHitomiGalleryToManga(gallery)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null
      }
      throw error
    }
  }

  async fetchMangaImages(id: number) {
    const manga = await this.fetchManga(id)
    return manga?.images ?? []
  }

  private async convertHitomiGalleryToManga(gallery: HitomiGallery): Promise<Manga> {
    const locale = 'ko' // TODO: Get from user preferences or context
    const artistValues = gallery.artists?.map(({ artist }) => artist)
    const characterValues = gallery.characters?.map(({ character }) => character)
    const groupValues = gallery.groups?.map(({ group }) => group)
    const seriesValues = gallery.parodys?.map(({ parody }) => parody)
    const languageValues = gallery.languages?.map(({ name }) => name) ?? [gallery.language]

    return {
      id: Number(gallery.id),
      artists: translateArtistList(artistValues, locale),
      group: translateGroupList(groupValues, locale),
      title: gallery.title,
      date: gallery.date,
      characters: translateCharacterList(characterValues, locale),
      series: translateSeriesList(seriesValues, locale),
      tags: gallery.tags?.map((tag) => {
        const category = this.getTagCategory(tag)
        return translateTag(category, tag.tag, locale)
      }),
      languages: translateLanguageList(languageValues, locale),
      images: await Promise.all(gallery.files.map((file) => this.getImageURL(gallery.id, file))),
      related: gallery.related,
      count: gallery.files.length,
      source: MangaSource.HITOMI,
    }
  }

  private findMatchingBrace(str: string, startIndex: number): number {
    let braceCount = 0
    let inString = false
    let escapeNext = false

    for (let i = startIndex; i < str.length; i++) {
      const char = str[i]

      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      if (char === '"' && !inString) {
        inString = true
      } else if (char === '"' && inString) {
        inString = false
      }

      if (!inString) {
        if (char === '{') {
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0) {
            return i
          }
        }
      }
    }

    return -1
  }

  private async getImageURL(galleryId: string, file: HitomiFile) {
    return await urlFromUrlFromHash(Number(galleryId), file, 'webp')
  }

  private getTagCategory(tag: Tag): MangaTagCategory {
    if (tag.female === 1 || tag.female === '1') {
      return 'female'
    }

    if (tag.male === 1 || tag.male === '1') {
      return 'male'
    }

    return 'other'
  }

  private async parseGalleryFromJS(jsText: string, id: number): Promise<HitomiGallery> {
    let jsonText = ''

    // Try with semicolon
    let match = jsText.match(/var\s+galleryinfo\s*=\s*(\{[\s\S]*?\});/)

    if (!match) {
      // Try without semicolon
      match = jsText.match(/var\s+galleryinfo\s*=\s*(\{[\s\S]*\})$/)
    }

    if (!match) {
      // Find the JSON boundaries
      const startIndex = jsText.indexOf('var galleryinfo = ')

      if (startIndex === -1) {
        throw new ParseError('hitomi: `galleryinfo` 변수를 찾을 수 없어요.', { mangaId: id })
      }

      const jsonStart = jsText.indexOf('{', startIndex)
      const jsonEnd = this.findMatchingBrace(jsText, jsonStart)

      if (jsonEnd === -1) {
        throw new ParseError('hitomi: JSON 객체의 끝을 찾을 수 없어요.', { mangaId: id })
      }

      jsonText = jsText.slice(jsonStart, jsonEnd + 1)
    } else {
      jsonText = match[1]
    }

    try {
      return JSON.parse(jsonText) as HitomiGallery
    } catch (error) {
      throw new ParseError('hitomi: `galleryinfo` 변수를 읽을 수 없어요.', {
        mangaId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
