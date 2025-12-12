import { captureException } from '@sentry/nextjs'

import { normalizeError, UpstreamServerError } from './errors'

export type ApiResponse<T = unknown> = T & {
  error?: {
    code: string
    message: string
    isRetryable: boolean
  }
}

type CacheControlHeaders = {
  vercel?: CacheControlOptions
  cloudflare?: CacheControlOptions
  browser?: CacheControlOptions
}

type CacheControlOptions = {
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
    headers['Cloudflare-Cache-Control'] = createCacheControl(cloudflare)
  }
  if (browser) {
    headers['Cache-Control'] = createCacheControl(browser)
  }
  return headers
}

export async function createHealthCheckHandler(
  serviceName: string,
  checks?: Record<string, () => Promise<boolean>>,
  init?: ResponseInit,
) {
  const healthChecks: Record<string, { status: 'healthy' | 'unhealthy'; error?: string }> = {}

  if (checks) {
    await Promise.all(
      Object.entries(checks).map(async ([name, check]) => {
        try {
          const isHealthy = await check()
          healthChecks[name] = { status: isHealthy ? 'healthy' : 'unhealthy' }
        } catch (error) {
          healthChecks[name] = {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      }),
    )
  }

  const allHealthy = Object.values(healthChecks).every((check) => check.status === 'healthy')

  return Response.json(
    {
      service: serviceName,
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: healthChecks,
    },
    init,
  )
}

export function handleRouteError(error: unknown, request: Request) {
  if (error instanceof Error && error.message === 'Network connection lost.') {
    return new Response('Client Closed Request', { status: 499 })
  }

  console.error(error)
  const normalizedError = normalizeError(error)

  if (!isUpstreamServer4XXError(normalizedError)) {
    captureException(normalizedError, {
      tags: {
        errorCode: normalizedError.errorCode,
        statusCode: normalizedError.statusCode,
      },
      extra: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        ...normalizedError.context,
      },
    })
  }

  const response: ApiResponse = {
    error: {
      code: normalizedError.errorCode,
      message: normalizedError.message,
      isRetryable: normalizedError.isRetryable,
    },
  }

  const headers = new Headers({ 'X-Error-Code': normalizedError.errorCode })
  return Response.json(response, { status: normalizedError.statusCode, headers })
}

export function isUpstreamServer4XXError(error: unknown): boolean {
  if (error instanceof UpstreamServerError) {
    return error.statusCode >= 400 && error.statusCode < 500
  }

  return false
}

export function isUpstreamServerError(error: unknown): boolean {
  if (error instanceof UpstreamServerError) {
    return error.statusCode >= 500
  }

  if (error instanceof Error) {
    return error.name === 'AbortError'
  }

  return false
}
