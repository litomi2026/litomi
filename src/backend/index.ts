import { Hono } from 'hono'
import { getConnInfo } from 'hono/bun'
import { compress } from 'hono/compress'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { etag } from 'hono/etag'
import { ipRestriction } from 'hono/ip-restriction'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'

import { env } from '@/env/server.hono'

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

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  ...app,
  port: Number(process.env.PORT ?? 8080),
  hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
}
