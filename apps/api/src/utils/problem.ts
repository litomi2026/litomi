import { genericProblemByStatus, PROBLEM, type ProblemSpec } from '@litomi/contracts'
import { createProblemDetailsResponse } from '@litomi/http/problem-details'
import type { Context } from 'hono'

import { noStoreCacheControl } from './cache-control'

export type ProblemResponseOptions = {
  /** @litomi/contracts PROBLEM 스펙 — slug/status/title 을 여기서 파생한다. */
  problem?: ProblemSpec
  /** problem 없이 던지는 generic status. problem 과 함께 주면 status override(드묾). */
  status?: number
  /** 발생 건별 dev-facing 진단(동적 값·generic 분기 설명). 사용자에게 표시하지 않는다. */
  detail?: string
  extensions?: Record<string, unknown>
  instance?: string
  headers?: HeadersInit
}

export function problemResponse(c: Context, options: ProblemResponseOptions): Response {
  const spec =
    options.problem ?? (options.status === undefined ? PROBLEM.SERVER_ERROR : genericProblemByStatus(options.status))

  const status = options.status ?? spec.status
  const headers = new Headers(c.res.headers)

  for (const [key, value] of new Headers(options.headers)) {
    headers.set(key, value)
  }

  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', noStoreCacheControl)
  }

  return createProblemDetailsResponse(c.req.raw, {
    status,
    code: spec.slug,
    title: spec.title,
    detail: options.detail,
    extensions: options.extensions,
    instance: options.instance,
    headers,
  })
}

export function authRequiredProblemResponse(
  c: Context,
  options: Pick<ProblemResponseOptions, 'headers'> = {},
): Response {
  return problemResponse(c, { problem: PROBLEM.AUTHENTICATION_REQUIRED, ...options })
}

export function tooManyRequestsProblemResponse(c: Context, retryAfterSeconds = 60): Response {
  const retryAfter = Number.isFinite(retryAfterSeconds) ? Math.max(1, Math.ceil(retryAfterSeconds)) : 60

  return problemResponse(c, {
    problem: PROBLEM.TOO_MANY_REQUESTS,
    headers: { 'Retry-After': String(retryAfter) },
  })
}
