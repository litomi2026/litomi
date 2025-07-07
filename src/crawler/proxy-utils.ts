import { captureException } from '@sentry/nextjs'
import { NextRequest } from 'next/server'

import { normalizeError } from './errors'

export type ApiResponse<T = unknown> = T & {
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

// Cache control helpers
export function createCacheControl(options: {
  public?: boolean
  private?: boolean
  maxAge?: number
  sMaxAge?: number
  staleWhileRevalidate?: number
  mustRevalidate?: boolean
  noCache?: boolean
  noStore?: boolean
}): string {
  const parts: string[] = []

  if (options.public) parts.push('public')
  if (options.private) parts.push('private')
  if (options.noCache) parts.push('no-cache')
  if (options.noStore) parts.push('no-store')
  if (options.mustRevalidate) parts.push('must-revalidate')
  if (options.maxAge !== undefined) parts.push(`max-age=${options.maxAge}`)
  if (options.sMaxAge !== undefined) parts.push(`s-maxage=${options.sMaxAge}`)
  if (options.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${options.staleWhileRevalidate}`)
  }

  return parts.join(', ')
}

export function handleError(error: unknown, request: NextRequest) {
  const normalizedError = normalizeError(error)

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

  const response: ApiResponse = {
    error: {
      code: normalizedError.errorCode,
      message: normalizedError.message,
      details: normalizedError.context,
    },
  }

  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Error-Code': normalizedError.errorCode,
  })

  return Response.json(response, { status: normalizedError.statusCode, headers })
}
