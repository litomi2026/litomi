import ms from 'ms'

import { ParseError } from '@/crawler/errors'
import { ProxyClient, ProxyClientConfig } from '@/crawler/proxy'
import { isUpstreamServerError } from '@/crawler/proxy-utils'
import {
  WebtoonCrawler,
  WebtoonEpisode,
  WebtoonList,
  WebtoonListItem,
  WebtoonSeries,
  WebtoonSeriesEpisode,
} from '@/crawler/webtoon/types'

export type ToonkorParams = {
  /** toonkor 도메인 (e.g., 'tkor079.com') */
  domain: string
  /** 페이지 경로 (e.g., '노예일지' 또는 '동살_1화.html') */
  path: string
  revalidate?: number
}

/** toonkor 도메인 패턴 (e.g., tkor079.com, tkor080.com) */
export const TOONKOR_DOMAIN_PATTERN = /^tkor\d+\.com$/

class ToonkorClient implements WebtoonCrawler<ToonkorParams> {
  private client: ProxyClient | null = null
  private currentDomain: string | null = null

  /**
   * 에피소드 데이터를 가져와요.
   */
  async fetchEpisode({ domain, path, revalidate }: ToonkorParams): Promise<WebtoonEpisode> {
    const images = await this.fetchEpisodeImages({ domain, path, revalidate })
    const title = this.extractTitleFromPath(path)

    return { images, title }
  }

  /**
   * 웹툰 목록을 가져와요.
   */
  async fetchList({ domain, revalidate }: ToonkorParams): Promise<WebtoonList> {
    const client = this.getClient(domain)
    const { data: html, finalUrl } = await client.fetchWithRedirect<string>('/웹툰', { next: { revalidate } }, true)
    const finalDomain = new URL(finalUrl).hostname
    this.updateDomain(finalDomain)
    return { items: this.extractListItems(html, finalDomain) }
  }

  /**
   * 시리즈 정보와 에피소드 목록을 가져와요.
   */
  async fetchSeries({ domain, path, revalidate }: ToonkorParams): Promise<WebtoonSeries> {
    const client = this.getClient(domain)
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    const { data: html, finalUrl } = await client.fetchWithRedirect<string>(
      normalizedPath,
      { next: { revalidate } },
      true,
    )

    const finalDomain = new URL(finalUrl).hostname
    this.updateDomain(finalDomain)
    return this.extractSeriesInfo(html, finalDomain, path)
  }

  /**
   * HTML에서 에피소드 목록을 추출해요.
   */
  private extractEpisodes(html: string): WebtoonSeriesEpisode[] {
    const episodes: WebtoonSeriesEpisode[] = []

    // <tr class="tborder"> 내의 에피소드 정보 추출
    // data-role="/노예일지_46화.html" alt="노예일지 46화" 패턴
    const episodePattern =
      /<td[^>]*class="content__title"[^>]*name="view_list"[^>]*data-role="([^"]+)"[^>]*alt="([^"]+)"[^>]*>/g

    // 날짜 패턴: <td ... class="episode__index" ... data-role="같은경로">2025-12-12</td>
    const datePattern =
      /<td[^>]*class="episode__index"[^>]*name="view_list"[^>]*data-role="([^"]+)"[^>]*>(\d{4}-\d{2}-\d{2})<\/td>/g

    // 날짜 맵 생성
    const dateMap = new Map<string, string>()
    let dateMatch
    while ((dateMatch = datePattern.exec(html)) !== null) {
      dateMap.set(dateMatch[1], dateMatch[2])
    }

    // 에피소드 추출
    let match
    while ((match = episodePattern.exec(html)) !== null) {
      const path = match[1]
      const title = match[2].trim()
      const publishedAt = dateMap.get(path)

      episodes.push({ path, title, publishedAt })
    }

    return episodes
  }

  /**
   * HTML에서 Base64로 인코딩된 이미지 URL을 추출해요.
   */
  private extractImageUrls(html: string, path: string): string[] {
    // var toon_img = 'Base64EncodedString'; 패턴 찾기
    const base64Match = html.match(/var\s+toon_img\s*=\s*'([^']+)'/)

    if (!base64Match) {
      throw new ParseError('toonkor: `toon_img` 변수를 찾을 수 없어요.', { path })
    }

    const base64String = base64Match[1]

    // Base64 디코딩
    let decodedHtml: string
    try {
      decodedHtml = Buffer.from(base64String, 'base64').toString('utf-8')
    } catch {
      throw new ParseError('toonkor: `toon_img` Base64 디코딩에 실패했어요.', { path })
    }

    // <img src="..."> 패턴에서 URL 추출
    const srcMatches = [...decodedHtml.matchAll(/src="([^"]+)"/g)]

    if (srcMatches.length === 0) {
      throw new ParseError('toonkor: 이미지 URL을 찾을 수 없어요.', { path })
    }

    return srcMatches.map((match) => match[1])
  }

  /**
   * HTML에서 웹툰 목록 항목들을 추출해요.
   */
  private extractListItems(html: string, domain: string): WebtoonListItem[] {
    const items: WebtoonListItem[] = []

    // <li class="section-item" alt="노예일지" ...> 패턴으로 각 웹툰 항목 찾기
    const itemPattern = /<li\s+class="section-item[^"]*"\s+alt="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g

    let match
    while ((match = itemPattern.exec(html)) !== null) {
      const title = match[1]
      const itemHtml = match[2]

      // href 추출: href="/노예일지"
      const hrefMatch = itemHtml.match(/href="(\/[^"]+)"[^>]*alt="[^"]*"[^>]*>\s*<h3>/)
      const path = hrefMatch?.[1] ?? `/${title.replace(/\s+/g, '-')}`

      // 썸네일 추출: src 또는 data-src
      let thumbnail: string | undefined
      const srcMatch = itemHtml.match(/<img\s+src="(\/data\/wtoon\/[^"]+)"/)
      const dataSrcMatch = itemHtml.match(/data-src="(\/data\/wtoon\/[^"]+)"/)
      if (srcMatch) {
        thumbnail = `https://${domain}${srcMatch[1]}`
      } else if (dataSrcMatch) {
        thumbnail = `https://${domain}${dataSrcMatch[1]}`
      }

      // 장르 추출: <div class="toon_gen">성인</div>
      const genreMatch = itemHtml.match(/<div class="toon_gen">\s*([^<]+)\s*<\/div>/)
      const genre = genreMatch?.[1]?.trim()

      // 성인 여부: <div class="toon-adult">19</div>
      const isAdult = itemHtml.includes('toon-adult')

      // 좋아요 수: <i class="fa fa-heart-o"></i>72
      const likesMatch = itemHtml.match(/<i class="fa fa-heart-o"[^>]*><\/i>(\d+)/)
      const likes = likesMatch ? parseInt(likesMatch[1], 10) : undefined

      // 업데이트 날짜: <div class="section-item-addon">12.10
      const updatedAtMatch = itemHtml.match(/<div class="section-item-addon">(\d+\.\d+)/)
      const updatedAt = updatedAtMatch?.[1]

      items.push({
        path,
        title,
        thumbnail,
        genre,
        isAdult,
        likes,
        updatedAt,
      })
    }

    return items
  }

  /**
   * HTML에서 시리즈 정보를 추출해요.
   */
  private extractSeriesInfo(html: string, domain: string, path: string): WebtoonSeries {
    // 제목 추출: <meta name="title" content="노예일지" />
    const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/)
    const title = titleMatch?.[1] ?? decodeURIComponent(path).replace(/^\//, '')

    // 작가 추출: <span class="bt_label">작가</span> <span class="bt_data">맑음,김파</span>
    const authorMatch = html.match(/작가<\/span>\s*<span class="bt_data">([^<]+)<\/span>/)
    const author = authorMatch?.[1]?.trim()

    // 총화수 추출: <span class="bt_label">총편수</span> <span class="bt_data">총 46화</span>
    const totalMatch = html.match(/총편수<\/span>\s*<span class="bt_data">총\s*(\d+)화<\/span>/)
    const totalEpisodes = totalMatch ? parseInt(totalMatch[1], 10) : undefined

    // 설명 추출: <td class="bt_over" colspan="4">...</td>
    const descMatch = html.match(/<td class="bt_over"[^>]*>([^<]+)<\/td>/)
    const description = descMatch?.[1]?.trim()

    // 썸네일 추출: <img src="/data/wtoon/xxx.jpg" style="width:100%; min-width:..." alt="노예일지">
    const thumbMatch = html.match(/<img\s+src="(\/data\/wtoon\/[^"]+)"[^>]*style="width:100%;[^"]*min-width/)
    const thumbnail = thumbMatch ? `https://${domain}${thumbMatch[1]}` : undefined

    // 에피소드 목록 추출: <tr class="tborder"> ... data-role="/노예일지_46화.html" ... </tr>
    const episodes = this.extractEpisodes(html)

    return {
      title,
      author,
      description,
      thumbnail,
      totalEpisodes,
      episodes,
    }
  }

  /**
   * path에서 제목을 추출해요. (예: "동살_1화.html" → "동살 1화")
   */
  private extractTitleFromPath(path: string): string {
    return decodeURIComponent(path)
      .replace(/\.html$/, '')
      .replace(/_/g, ' ')
  }

  /**
   * 에피소드 페이지에서 이미지 URL 목록을 추출해요.
   *
   * 이미지 URL은 Base64로 인코딩된 `toon_img` 변수에 저장되어 있어요.
   */
  private async fetchEpisodeImages({ domain, path, revalidate }: ToonkorParams): Promise<string[]> {
    const client = this.getClient(domain)
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    const { data: html, finalUrl } = await client.fetchWithRedirect<string>(
      normalizedPath,
      { next: { revalidate } },
      true,
    )

    this.updateDomain(new URL(finalUrl).hostname)
    return this.extractImageUrls(html, path)
  }

  private getClient(domain: string): ProxyClient {
    if (!this.client || this.currentDomain !== domain) {
      this.client = new ProxyClient(createToonkorConfig(domain))
      this.currentDomain = domain
    }

    return this.client
  }

  private updateDomain(domain: string) {
    if (this.currentDomain !== domain) {
      this.client = new ProxyClient(createToonkorConfig(domain))
      this.currentDomain = domain
    }
  }
}

function createToonkorConfig(domain: string): ProxyClientConfig {
  return {
    baseURL: `https://${domain}`,
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
    requestTimeout: ms('20 seconds'),
    defaultHeaders: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  }
}

// Singleton instance
export const toonkorClient = new ToonkorClient()
