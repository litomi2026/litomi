import { captureException } from '@sentry/nextjs'

import { CANONICAL_URL } from '@/constants'
import { normalizeError, UpstreamServerError } from '@/crawler/errors'
import { type CacheControlOptions, createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'
import {
  createProblemTypeUrl,
  getStatusTitle,
  PROBLEM_CONTENT_TYPE,
  type ProblemDetails,
} from '@/utils/problem-details'

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

export function calculateOptimalCacheDuration(images: string[]): number {
  const now = Math.floor(Date.now() / 1000)
  let nearestExpiration

  for (const imageUrl of images) {
    const expiration = extractExpirationFromURL(imageUrl)
    if (expiration && expiration > now) {
      if (!nearestExpiration || expiration < nearestExpiration) {
        nearestExpiration = expiration
      }
    }
  }

  if (!nearestExpiration) {
    return sec('30 days')
  }

  // Apply a small buffer (5 minutes) for:
  // - Clock skew between servers
  // - Request processing time
  // - User's actual image loading time
  const buffer = sec('5 minutes')

  return nearestExpiration - buffer - now
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

function extractExpirationFromURL(imageUrl: string): number | null {
  try {
    const url = new URL(imageUrl, CANONICAL_URL)
    const expires = url.searchParams.get('expires')
    if (expires && /^\d+$/.test(expires)) {
      return parseInt(expires, 10)
    }
  } catch {
    // Not a valid URL
  }
  return null
}
