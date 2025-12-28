import { captureException } from '@sentry/nextjs'

import {
  createProblemTypeUrl,
  getStatusTitle,
  PROBLEM_CONTENT_TYPE,
  type ProblemDetails,
} from '@/utils/problem-details'

import { normalizeError, UpstreamServerError } from './errors'

export type CreateProblemDetailsResponseOptions = {
  code: string
  detail?: string
  headers?: HeadersInit
  instance?: string
  status: number
  title?: string
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

export function createProblemDetailsResponse(request: Request, options: CreateProblemDetailsResponseOptions): Response {
  const url = new URL(request.url)
  const instance = options.instance ?? url.pathname + url.search

  const problem: ProblemDetails = {
    type: createProblemTypeUrl(url.origin, options.code),
    title: options.title ?? getStatusTitle(options.status),
    status: options.status,
    detail: options.detail,
    instance,
  }

  const headers = new Headers(options.headers)
  headers.set('Content-Type', PROBLEM_CONTENT_TYPE)

  return new Response(JSON.stringify(problem), { status: options.status, headers })
}

export function handleRouteError(error: unknown, request: Request) {
  if (error instanceof Error && error.message === 'Network connection lost.') {
    return createProblemDetailsResponse(request, {
      status: 499,
      code: 'client-closed-request',
      detail: '요청이 취소됐어요',
    })
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

  const headers = new Headers({ 'X-Error-Code': normalizedError.errorCode })

  if (normalizedError instanceof UpstreamServerError && normalizedError.retryAfter) {
    headers.set('Retry-After', normalizedError.retryAfter)
  }

  return createProblemDetailsResponse(request, {
    status: normalizedError.statusCode,
    code: normalizedError.errorCode,
    detail: normalizedError.message,
    headers,
  })
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
