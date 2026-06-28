import { httpInstrumentationMiddleware } from '@hono/otel'
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

const csrfMiddleware = csrf({
  origin: isAllowedRequestOrigin,
  secFetchSite: process.env.NODE_ENV === 'production' ? 'same-origin' : 'same-site',
})

// 1. 관측성 및 전역 설정
app.use(httpInstrumentationMiddleware({ serviceName: 'litomi-api' }))
app.use('*', requestId())
app.use(logger())
app.use(timing())
app.use(contextStorage())

// 2. 초기 보안 및 네트워크 방어막
app.use('*', ipRestriction(getConnInfo, { denyList: [] }))
app.use('/api/*', secureHeaders(getDefaultSecureHeadersOptions()))

app.use(
  '/i/*',
  secureHeaders({
    ...getDefaultSecureHeadersOptions(),
    crossOriginResourcePolicy: 'same-site',
  }),
)

app.use(
  '/i/*',
  cors({
    origin: () => APP_ORIGIN,
    allowMethods: ['GET', 'HEAD'],
    exposeHeaders: ['ETag'],
    credentials: true,
    maxAge: 86400,
  }),
)

// 3. 상태 검사
app.route('/', probeRoutes)

// 4. 응답 변환
app.use(compress())

app.use('/api/*', async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD') {
    return await etagMiddleware(c, next)
  }

  return await next()
})

// 5. 애플리케이션 보안 계층
app.use('*', (c, next) => {
  if (c.req.path === '/api/v1/billing/portone/webhook') {
    return next()
  }

  return csrfMiddleware(c, next)
})

app.use('*', auth)

// 6. 하위 route
app.route('/api', apiRoutes)
app.route('/i', imageRoutes)

export default app
