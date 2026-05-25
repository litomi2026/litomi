import type { Context } from 'hono'

import {
  createProblemDetailsResponse,
  type CreateProblemDetailsResponseOptions,
  problemCode,
} from '@litomi/http/problem-details'

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

  return createProblemDetailsResponse(c.req.raw, { ...options, headers })
}
