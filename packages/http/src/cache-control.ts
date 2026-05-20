export type CacheControlHeaders = {
  vercel?: CacheControlOptions
  cloudflare?: CacheControlOptions
  browser?: CacheControlOptions
}

export type CacheControlOptions = {
  public?: boolean
  private?: boolean
  maxAge?: number
  sMaxAge?: number
  swr?: number
  mustRevalidate?: boolean
  noCache?: boolean
  noStore?: boolean
}

/**
 * - Origin 서버 요청 주기: s-maxage ~ (s-maxage + swr)
 * - 최대 캐싱 데이터 수명: s-maxage + maxage + min(swr, maxage)
 */
export function createCacheControl(options: CacheControlOptions): string {
  const parts: string[] = []

  if (options.public && !options.private) {
    parts.push('public')
  }
  if (options.private && !options.public) {
    parts.push('private')
  }
  if (options.noCache) {
    parts.push('no-cache')
  }
  if (options.noStore) {
    parts.push('no-store')
  }
  if (options.mustRevalidate) {
    parts.push('must-revalidate')
  }
  if (options.maxAge !== undefined) {
    parts.push(`max-age=${options.maxAge}`)
  }
  if (options.sMaxAge !== undefined && !options.private) {
    parts.push(`s-maxage=${options.sMaxAge}`)
  }
  if (options.swr !== undefined && !options.mustRevalidate) {
    parts.push(`stale-while-revalidate=${options.swr}`)
  }

  return parts.join(', ')
}

/**
 * - 신선한 데이터가 중요하면 Vercel 대신 Cloudflare 정책만 사용하기
 * - 오류 응답에는 swr 넣지 않기
 * - 브라우저 캐시 정책은 가능한 간단하게 유지하기
 */
export function createCacheControlHeaders({ vercel, cloudflare, browser }: CacheControlHeaders): HeadersInit {
  const headers: HeadersInit = {}
  if (vercel) {
    headers['Vercel-CDN-Cache-Control'] = createCacheControl(vercel)
  }
  if (cloudflare) {
    headers['Cloudflare-CDN-Cache-Control'] = createCacheControl(cloudflare)
  }
  if (browser) {
    headers['Cache-Control'] = createCacheControl(browser)
  }
  return headers
}
