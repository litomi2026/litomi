import { httpInstrumentationMiddleware } from '@hono/otel'
import { env } from '@litomi/env/server.common'
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

import apiRoutes from './api'
import imageRoutes from './i'
import { auth } from './middleware/auth'
import { getDefaultSecureHeadersOptions } from './middleware/secure-headers'
import probeRoutes from './probe'
import { APP_ORIGIN, isAllowedRequestOrigin } from './utils/request-origin'

export type Env = {
  Variables: {
    requestId: string
    userId?: number
    isAdult?: boolean
  }
}

const app = new Hono<Env>()
const etagMiddleware = etag()
const csrfSecFetchSite = process.env.NODE_ENV === 'production' ? 'same-origin' : 'same-site'

// NOTE: 공통 미들웨어
app.use(httpInstrumentationMiddleware({ serviceName: 'litomi-api' }))
app.use('*', ipRestriction(getConnInfo, { denyList: [] }))
app.use('*', requestId())
app.use(logger())
app.use(timing())
app.route('/', probeRoutes)
app.use(compress())
app.use(contextStorage())

app.use(
  '/i/*',
  cors({
    origin: () => APP_ORIGIN,
    allowMethods: ['GET', 'HEAD'],
    exposeHeaders: ['ETag'],
    maxAge: 86400,
  }),
)

app.use(csrf({ origin: isAllowedRequestOrigin, secFetchSite: csrfSecFetchSite }))
app.use('*', auth)

// NOTE: /api 미들웨어
app.use('/api/*', secureHeaders(getDefaultSecureHeadersOptions()))

app.use('/api/*', async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD') {
    return await etagMiddleware(c, next)
  }

  return await next()
})

// NOTE: /i 미들웨어
app.use(
  '/i/*',
  secureHeaders({
    ...getDefaultSecureHeadersOptions(),
    crossOriginResourcePolicy: 'same-site',
  }),
)

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

app.route('/api', apiRoutes)
app.route('/i', imageRoutes)

export default app
