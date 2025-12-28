import { Hono } from 'hono'
import { getConnInfo } from 'hono/bun'
import { compress } from 'hono/compress'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { etag } from 'hono/etag'
import { HTTPException } from 'hono/http-exception'
import { ipRestriction } from 'hono/ip-restriction'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'

import { env } from '@/env/server.hono'
import {
  createProblemTypeUrl,
  getStatusTitle,
  PROBLEM_CONTENT_TYPE,
  type ProblemDetails,
} from '@/utils/problem-details'

import appRoutes from './app'
import { auth } from './middleware/auth'

const { CORS_ORIGIN } = env

export type Env = {
  Variables: {
    requestId: string
    userId?: number
  }
}

const app = new Hono<Env>()

app.use(
  '*',
  cors({
    origin: [CORS_ORIGIN, 'http://localhost:3000'],
    credentials: true,
    exposeHeaders: ['Retry-After'],
  }),
)

app.use('*', ipRestriction(getConnInfo, { denyList: [] }))
app.use('*', requestId())
app.use(compress())
app.use(contextStorage())
app.use(csrf({ origin: CORS_ORIGIN, secFetchSite: 'same-site' }))
app.use(logger())
app.use(secureHeaders())
app.use(timing())
app.use('/api/*', auth)
app.use('/api/*', etag())

// NOTE: 쿠키와 헤더는 Cloudflare 캐시 키가 아니기에 현재는 search param 값만 사용 가능함
// app.use(
//   languageDetector({
//     lookupQueryString: 'locale',
//     lookupCookie: 'locale',
//     supportedLanguages: ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'],
//     fallbackLanguage: 'ko',
//     caches: false,
//   }),
// )

app.route('/', appRoutes)

app.notFound((c) => {
  const url = new URL(c.req.url)
  const problem: ProblemDetails = {
    type: createProblemTypeUrl(url.origin, 'not-found'),
    title: getStatusTitle(404),
    status: 404,
    detail: '찾을 수 없어요',
    instance: url.pathname + url.search,
  }

  return c.body(JSON.stringify(problem), 404, { 'Content-Type': PROBLEM_CONTENT_TYPE })
})

app.onError(async (error, c) => {
  const url = new URL(c.req.url)
  const status = error instanceof HTTPException ? error.status : 500

  const code = getProblemCodeFromStatus(status)
  const title = getStatusTitle(status)
  const instance = url.pathname + url.search

  // detail: prefer explicit message (safe, friendly) when present
  let detail: string | undefined
  const headers: Record<string, string> = {}

  if (error instanceof HTTPException) {
    const res = error.getResponse()

    const retryAfter = res.headers.get('Retry-After')
    if (retryAfter) {
      headers['Retry-After'] = retryAfter
    }

    // Prefer the original response text if it exists (e.g., c.text('...', 429))
    const resText = await res
      .clone()
      .text()
      .catch(() => '')
    const normalized = resText.trim()

    if (normalized) {
      detail = normalized
    } else if (error.message && error.message !== 'HTTP Exception') {
      detail = error.message
    } else {
      detail = title
    }
  } else {
    // NOTE: 예상치 못한 오류는 내부 정보를 노출하지 않음
    detail = title
  }

  const problem: ProblemDetails = {
    type: createProblemTypeUrl(url.origin, code),
    title,
    status,
    detail,
    instance,
  }

  headers['Content-Type'] = PROBLEM_CONTENT_TYPE
  return c.body(JSON.stringify(problem), status, headers)
})

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  ...app,
  port: Number(process.env.PORT ?? 8080),
  hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
}

function getProblemCodeFromStatus(status: number): string {
  if (status === 400) return 'bad-request'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 408) return 'request-timeout'
  if (status === 409) return 'conflict'
  if (status === 429) return 'too-many-requests'
  if (status === 502) return 'bad-gateway'
  if (status === 503) return 'service-unavailable'
  if (status === 504) return 'gateway-timeout'
  return 'internal-server-error'
}
