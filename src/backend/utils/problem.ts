import type { Context } from 'hono'

import {
  createProblemTypeUrl,
  getStatusTitle,
  PROBLEM_CONTENT_TYPE,
  type ProblemDetails,
} from '@/utils/problem-details'

type Options = {
  code?: string
  detail?: string
  headers?: HeadersInit
  instance?: string
  status: number
  title?: string
}

export function problemResponse(c: Context, options: Options): Response {
  const url = new URL(c.req.url)
  const instance = options.instance ?? url.pathname + url.search
  const title = options.title ?? getStatusTitle(options.status)
  const code = options.code ?? getProblemCodeFromStatus(options.status)

  const problem: ProblemDetails = {
    type: createProblemTypeUrl(url.origin, code),
    title,
    status: options.status,
    detail: options.detail,
    instance,
  }

  const headers = new Headers(options.headers)
  headers.set('Content-Type', PROBLEM_CONTENT_TYPE)

  return new Response(JSON.stringify(problem), { status: options.status, headers })
}

function getProblemCodeFromStatus(status: number): string {
  if (status === 400) return 'bad-request'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 408) return 'request-timeout'
  if (status === 409) return 'conflict'
  if (status === 429) return 'too-many-requests'
  if (status === 499) return 'client-aborted'
  if (status === 502) return 'bad-gateway'
  if (status === 503) return 'service-unavailable'
  if (status === 504) return 'gateway-timeout'
  return 'internal-server-error'
}
