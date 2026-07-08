import { normalizeError, UpstreamServerError } from '@litomi/crawler/core/errors'
import { env } from '@litomi/env/client'
import { createProblemDetailsResponse } from '@litomi/http/problem-details'
import { sec } from '@litomi/std'
import { captureException } from '@sentry/core'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export function calculateOptimalCacheDuration(images: string[]): number {
  const now = Math.floor(Date.now() / 1000)
  let nearestExpiration: number | undefined

  for (const imageUrl of images) {
    const expiration = extractExpirationFromURL(imageUrl)
    if (expiration && expiration > now) {
      if (!nearestExpiration || expiration < nearestExpiration) {
        nearestExpiration = expiration
      }
    }
  }

  if (!nearestExpiration) {
    return sec('90 days')
  }

  const buffer = sec('5 minutes')
  return nearestExpiration - buffer - now
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
        headers: getSafeRequestHeaders(request),
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

function extractExpirationFromURL(imageUrl: string): number | null {
  try {
    const url = new URL(imageUrl, NEXT_PUBLIC_APP_ORIGIN)
    const expires = url.searchParams.get('expires')
    if (expires && /^\d+$/.test(expires)) {
      return parseInt(expires, 10)
    }
  } catch {
    // Not a valid URL
  }
  return null
}

function getSafeRequestHeaders(request: Request): Record<string, string> {
  const headers = new Headers(request.headers)

  for (const sensitiveHeader of ['authorization', 'cookie', 'proxy-authorization', 'set-cookie', 'x-api-key']) {
    headers.delete(sensitiveHeader)
  }

  return Object.fromEntries(headers.entries())
}

function isUpstreamServer4XXError(error: unknown): boolean {
  if (error instanceof UpstreamServerError) {
    return error.statusCode >= 400 && error.statusCode < 500
  }

  return false
}
