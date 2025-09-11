import { captureException } from '@sentry/nextjs'

import { normalizeError, UpstreamServerError } from './errors'

export type ApiResponse<T = unknown> = T & {
  error?: {
    code: string
    message: string
  }
}

/**
 * - Origin 서버 요청 주기: s-maxage ~ (s-maxage + swr)
 * - 최대 캐싱 데이터 수명: s-maxage + maxage + min(swr, maxage)
 * - 로딩 볼 확률: s-maxage + swr 주기마다 (s-maxage / (s-maxage + swr))^n 확률로 로딩을 봄
 *   - n = s-maxage + swr 기간 동안 들어오는 사용자 수
 */
export function createCacheControl(options: {
  public?: boolean
  private?: boolean
  maxAge?: number
  sMaxAge?: number
  swr?: number
  mustRevalidate?: boolean
  noCache?: boolean
  noStore?: boolean
}): string {
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
  if (options.swr !== undefined) {
    parts.push(`stale-while-revalidate=${options.swr}`)
  }

  return parts.join(', ')
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
