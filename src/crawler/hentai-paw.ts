import ms from 'ms'
import { parse } from 'node-html-parser'

import { MangaSource } from '@/database/enum'
import { Multilingual } from '@/translation/common'
import { translateTag } from '@/translation/tag'
import { Manga, MangaTag } from '@/types/manga'
import { sec } from '@/utils/date'

import { ProxyClient, ProxyClientConfig } from './proxy'
import { isUpstreamServer5XXError } from './proxy-utils'

type HentaiPawManga = {
  id: number
  title: string
  titleKo?: string
  tags: string[]
  artist?: string
  group?: string
  series?: string
  type?: string
  language?: string
  pageCount: number
  uploadDate?: string
  thumbnailUrl: string
  characters?: string[]
}

type HentaiPawSlide = {
  src: string
}

const HENTAIPAW_CONFIG: ProxyClientConfig = {
  baseURL: 'https://hentaipaw.com',
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: ms('10 minutes'),
    shouldCountAsFailure: isUpstreamServer5XXError,
  },
  retry: {
    maxRetries: 2,
    initialDelay: ms('1 second'),
    maxDelay: ms('5 seconds'),
    backoffMultiplier: 2,
    jitter: true,
  },
  requestTimeout: ms('20 seconds'),
  defaultHeaders: {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://hentaipaw.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
}

export class HentaiPawClient {
  private static instance: HentaiPawClient
  private readonly client: ProxyClient

  private constructor() {
    this.client = new ProxyClient(HENTAIPAW_CONFIG)
  }

  static getInstance(): HentaiPawClient {
    if (!HentaiPawClient.instance) {
      HentaiPawClient.instance = new HentaiPawClient()
    }
    return HentaiPawClient.instance
  }

  async fetchManga(id: number, revalidate = sec('1 week')): Promise<Manga | null> {
    const html = await this.client.fetch<string>(`/articles/${id}`, { next: { revalidate } }, true)
    const manga = this.parseMangaFromHTML(html, id)

    if (!manga) {
      return null
    }

    return this.convertHentaiPawToManga(manga)
  }

  async fetchMangaImages(id: number, revalidate = sec('1 week')): Promise<string[]> {
    const html = await this.client.fetch<string>(`/viewer?articleId=${id}`, { next: { revalidate } }, true)
    return this.extractImageURLsFromHTML(html)
  }

  async fetchMangas(page: number, revalidate = 21600): Promise<Manga[]> {
    try {
      const html = await this.client.fetch<string>(`/?page=${page}`, { next: { revalidate } }, true)
      const mangaIds = this.extractMangaIdsFromListHTML(html)

      // Fetch details for each manga (in parallel with limited concurrency)
      const mangaPromises = mangaIds.slice(0, 20).map((id) => this.fetchManga(id, revalidate))
      const mangas = await Promise.all(mangaPromises)

      return mangas.filter((manga): manga is Manga => manga !== null)
    } catch (error) {
      console.error(`Failed to fetch manga list for page ${page}:`, error)
      return []
    }
  }

  private convertHentaiPawToManga(manga: HentaiPawManga): Manga {
    const locale: keyof Multilingual = 'ko'

    return {
      id: manga.id,
      artists: manga.artist ? [{ label: manga.artist, value: manga.artist }] : [],
      characters: manga.characters ? manga.characters.map((char) => ({ label: char, value: char })) : [],
      group: manga.group ? [{ label: manga.group, value: manga.group }] : [],
      series: manga.series ? [{ label: manga.series, value: manga.series }] : [],
      tags: this.convertTagsToMangaTags(manga.tags, locale),
      title: manga.titleKo || manga.title,
      type: manga.type || 'unknown',
      languages: manga.language ? [{ label: manga.language, value: manga.language }] : [],
      images: [manga.thumbnailUrl],
      count: manga.pageCount,
      source: MangaSource.HENTAIPAW,
    }
  }

  private convertTagsToMangaTags(tags: string[], locale: keyof Multilingual): MangaTag[] {
    return tags.map((tag) => {
      // HentaiPaw tags might need different parsing logic
      // For now, treat them as 'other' category
      return translateTag('other', tag, locale)
    })
  }

  // ✅
  private extractImageURLsFromHTML(html: string): string[] {
    try {
      const slidesMatch = html.match(/"slides\\":\s*(\[[\s\S]*?\])\s*(?:,\s*\\"startingPage\\"|}\])/)

      if (!slidesMatch || !slidesMatch[1]) {
        const pattern = /https:\/\/cdn\.imagedeliveries\.com\/\d+\/\w+\/\d+\.webp/g
        return html.match(pattern) || []
      }

      const unescapedJson = slidesMatch[1].replace(/\\"/g, '"')
      const slides: HentaiPawSlide[] = JSON.parse(unescapedJson)
      return slides.map((slide) => slide.src)
    } catch {
      const pattern = /https:\/\/cdn\.imagedeliveries\.com\/\d+\/\w+\/\d+\.webp/g
      return html.match(pattern) || []
    }
  }

  private extractMangaIdsFromListHTML(html: string): number[] {
    const pattern =
      /<a[^>]*href=["']([^"']+)["'][^>]*>(?:(?!<\/a>).)*?<span[^>]*class=["'][^"']*fi-kr[^"']*["'][^>]*>(?:(?!<\/a>).)*?<\/a>/g
    const hrefPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>/
    const numberPattern = /\/(\d+)(?:[^/\d]*)?$/

    const ids: number[] = []
    let match

    while ((match = pattern.exec(html)) !== null) {
      const hrefMatch = hrefPattern.exec(match[0])
      if (hrefMatch && hrefMatch[1]) {
        const href = hrefMatch[1]
        const numberMatch = numberPattern.exec(href)
        if (numberMatch && numberMatch[1]) {
          ids.push(parseInt(numberMatch[1], 10))
        }
      }
    }

    return ids
  }

  private parseMangaFromHTML(html: string, id: number): HentaiPawManga | null {
    const root = parse(html)
    const articleDetails = root.querySelector('#article-details')

    if (!articleDetails) {
      console.error('Article details not found')
      return null
    }

    // Get title
    const title = articleDetails.querySelector('h1')?.text?.trim()
    if (!title) {
      console.error('Title not found')
      return null
    }

    // Look for Korean title in alternative locations or use main title
    const titleKo = articleDetails.querySelector('h2')?.text?.trim() || title

    // Get article tag information section
    const articleTagInformation = articleDetails.querySelector('#article-tag-information')
    if (!articleTagInformation) {
      console.error('Article tag information not found')
      return null
    }

    // Parse each section
    const sections = articleTagInformation.querySelectorAll('.flex.flex-wrap.gap-1')

    let artist: string | undefined
    let group: string | undefined
    let series: string | undefined
    let type: string | undefined
    let language: string | undefined
    const tags: string[] = []
    const characters: string[] = []
    let pageCount = 0

    sections.forEach((section) => {
      const heading = section.querySelector('h3')?.text?.trim().toLowerCase()

      if (!heading) return

      // Extract all link texts from this section
      const links = section.querySelectorAll('a')
      const values = links.map((link) => link.text?.trim()).filter(Boolean)

      // Check if section has "N/A" text
      const hasNA = section.querySelector('p')?.text?.trim() === 'N/A'

      switch (heading) {
        case 'artists:':
          artist = values[0] // Take first artist
          break
        case 'category:':
          type = values[0]
          break
        case 'characters:':
          characters.push(...values)
          break
        case 'groups:':
          if (!hasNA && values.length > 0) {
            group = values[0] // Take first group
          }
          break
        case 'language:':
          language = values[0]
          break
        case 'parodies:':
          if (!hasNA && values.length > 0) {
            series = values[0] // Take first parody as series
          }
          break
        case 'tags:':
          tags.push(...values)
          break
      }
    })

    // Try to get page count from other sources in the HTML
    // Look for page count in various possible locations
    const pageCountMatch = html.match(/(\d+)\s*(?:pages?|images?)/i)
    if (pageCountMatch) {
      pageCount = parseInt(pageCountMatch[1], 10)
    } else {
      // Default to 1 if not found
      pageCount = 1
    }

    return {
      id,
      title,
      titleKo,
      tags,
      artist,
      group,
      series,
      type,
      language,
      pageCount,
      characters,
      thumbnailUrl: `https://cdn.imagedeliveries.com/${id}/thumbnails/cover.webp`,
    }
  }
}
