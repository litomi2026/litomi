import { translateArtistList } from '@litomi/catalog/translation/artist'
import { translateCharacterList } from '@litomi/catalog/translation/character'
import { translateGroupList } from '@litomi/catalog/translation/group'
import { translateLanguageList } from '@litomi/catalog/translation/language'
import { translateSeriesList } from '@litomi/catalog/translation/series'
import { translateTag } from '@litomi/catalog/translation/tag'
import { translateType } from '@litomi/catalog/translation/type'
import { Locale } from '@litomi/domain/locale'
import { MangaSource } from '@litomi/domain/manga/model'
import { Manga } from '@litomi/domain/manga/model'
import ms from 'ms'
import { parse } from 'node-html-parser'

import { isUpstreamServerError } from '../core/errors'
import { ProxyClient, ProxyClientConfig } from '../core/proxy'

type HentaiPawSlide = {
  src: string
}

type MangaFetchParams = {
  id: number
  locale: Locale
  revalidate?: number
  signal?: AbortSignal
}

type MangaImagesFetchParams = {
  id: number
  revalidate?: number
  signal?: AbortSignal
}

const HENTAIPAW_CONFIG: ProxyClientConfig = {
  baseURL: 'https://hentaipaw.com',
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
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    referer: 'https://hentaipaw.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
}

class HentaiPawClient {
  private readonly client: ProxyClient

  constructor() {
    this.client = new ProxyClient(HENTAIPAW_CONFIG)
  }

  async fetchManga({ id, locale, revalidate, signal }: MangaFetchParams): Promise<Manga | null> {
    const html = await this.client.fetch<string>(`/articles/${id}`, { next: { revalidate }, signal }, true)
    return this.parseMangaFromHTML(html, id, locale)
  }

  async fetchMangaImages({ id, revalidate, signal }: MangaImagesFetchParams): Promise<string[] | null> {
    const html = await this.client.fetch<string>(`/viewer?articleId=${id}`, { next: { revalidate }, signal }, true)
    return this.extractImageURLsFromHTML(html)
  }

  private extractImageURLsFromHTML(html: string): string[] | null {
    const root = parse(html)
    const scripts = root.querySelectorAll('script')

    for (const script of scripts) {
      const scriptContent = script.innerHTML

      if (!scriptContent.includes('"slides":')) {
        continue
      }

      const slidesMatch =
        scriptContent.match(/"slides":\s*(\[[\s\S]*?\])\s*(?:,\s*"[^"]+"|})/) ||
        scriptContent.match(/"slides":\[(.*?)\],"startingPage":/s)

      if (!slidesMatch || !slidesMatch[1]) {
        return null
      }

      try {
        const slides: HentaiPawSlide[] = JSON.parse(slidesMatch[1])
        return slides.map((slide) => slide.src).filter(Boolean)
      } catch (parseError) {
        console.error('HentaiPawClient - extractImageURLsFromHTML:', parseError)
      }
    }

    const matches = html.match(/https:\/\/cdn\.imagedeliveries\.com\/\d+\/\w+\/\d+\.webp/g)
    return matches ? Array.from(new Set(matches)) : null
  }

  private parseMangaFromHTML(html: string, id: number, locale: Locale): Manga | null {
    const root = parse(html)
    const articleDetails = root.querySelector('#article-details')

    if (!articleDetails) {
      console.error('HentaiPawClient - parseMangaFromHTML - Article details not found')
      return null
    }

    const title = articleDetails.querySelector('h2')?.text?.trim() || articleDetails.querySelector('h1')?.text?.trim()

    if (!title) {
      console.error('HentaiPawClient - parseMangaFromHTML - Title not found')
      return null
    }

    const articleTagInformation = articleDetails.querySelector('#article-tag-information')

    if (!articleTagInformation) {
      console.error('HentaiPawClient - parseMangaFromHTML - Article tag information not found')
      return null
    }

    const sections = articleTagInformation.querySelectorAll('.flex.flex-wrap.gap-1')
    let artists: string[] | undefined
    let groups: string[] | undefined
    let series: string[] | undefined
    let type: string | undefined
    let languages: string[] | undefined
    let tags: string[] | undefined
    let characters: string[] | undefined
    let pageCount = 0

    for (const section of sections) {
      const heading = section.querySelector('h3')?.text?.trim().toLowerCase()

      if (!heading) {
        continue
      }

      const hasNA = section.querySelector('p')?.text?.trim() === 'N/A'

      if (hasNA) {
        continue
      }

      const links = section.querySelectorAll('a')
      const values = links.map((link) => link.text.trim()).filter(Boolean)

      if (values.length === 0) {
        continue
      }

      switch (heading) {
        case 'artists:':
          artists = values
          break
        case 'category:':
          type = values[0]
          break
        case 'characters:':
          characters = values
          break
        case 'groups:':
          groups = values
          break
        case 'language:':
          languages = values
          break
        case 'parodies:':
          series = values
          break
        case 'tags:':
          tags = values
          break
      }
    }

    const pageCountMatch = html.match(/(\d+)\s*(?:pages?|images?)/i)

    if (pageCountMatch) {
      pageCount = parseInt(pageCountMatch[1], 10)
    } else {
      pageCount = 1
    }

    return {
      id,
      title,
      tags: tags?.map((tag) => translateTag('other', tag, locale)),
      artists: translateArtistList(artists, locale),
      group: translateGroupList(groups, locale),
      series: translateSeriesList(series, locale),
      type: translateType(type, locale),
      languages: translateLanguageList(languages, locale),
      count: pageCount,
      characters: translateCharacterList(characters, locale),
      images: [{ thumbnail: { url: `https://cdn.imagedeliveries.com/${id}/thumbnails/cover.webp` } }],
      source: MangaSource.HENTAIPAW,
    }
  }
}

// Singleton instance
export const hentaiPawClient = new HentaiPawClient()
