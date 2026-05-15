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
