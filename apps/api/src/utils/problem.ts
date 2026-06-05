import type { Context } from 'hono'

import {
  createProblemDetailsResponse,
  type CreateProblemDetailsResponseOptions,
  problemCode,
} from '@litomi/http/problem-details'

import { noStoreCacheControl } from './cache-control'

export type ProblemResponseOptions = CreateProblemDetailsResponseOptions

export function authRequiredProblemResponse(
  c: Context,
  options: Pick<ProblemResponseOptions, 'headers'> = {},
): Response {
  return problemResponse(c, {
    status: 401,
    code: problemCode.AUTHENTICATION_REQUIRED,
    detail: '로그인 정보가 없거나 만료됐어요',
    ...options,
  })
}

export function problemResponse(c: Context, options: ProblemResponseOptions): Response {
  const headers = new Headers(c.res.headers)

  for (const [key, value] of new Headers(options.headers)) {
    headers.set(key, value)
  }

  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', noStoreCacheControl)
  }

  return createProblemDetailsResponse(c.req.raw, { ...options, headers })
}

export function tooManyRequestsProblemResponse(c: Context, retryAfterSeconds = 60): Response {
  const retryAfter = Number.isFinite(retryAfterSeconds) ? Math.max(1, Math.ceil(retryAfterSeconds)) : 60

  return problemResponse(c, {
    status: 429,
    detail: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
    headers: { 'Retry-After': String(retryAfter) },
  })
}
