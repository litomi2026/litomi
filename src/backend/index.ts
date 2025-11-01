import { Hono } from 'hono'
import { getConnInfo } from 'hono/bun'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { etag } from 'hono/etag'
import { ipRestriction } from 'hono/ip-restriction'
import { languageDetector } from 'hono/language'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'

import { CORS_ORIGIN } from '@/constants/env'

import appRoutes from './app'
import { auth } from './middleware/auth'

export type Env = {
  Variables: {
    requestId: string
    userId?: number
  }
}

const app = new Hono<Env>()

app.use('*', cors({ origin: CORS_ORIGIN, credentials: true }))
app.use('*', ipRestriction(getConnInfo, { denyList: [] }))
app.use('*', requestId())
// app.use(compress()) // NOTE: This middleware uses CompressionStream which is not yet supported in Bun.
app.use(contextStorage())
app.use(csrf({ origin: CORS_ORIGIN, secFetchSite: 'same-site' }))
app.use(logger())
app.use(secureHeaders())
app.use(timing())
app.use('/api/*', auth)
app.use('/api/*', etag())

app.use(
  languageDetector({
    lookupQueryString: 'locale',
    lookupCookie: 'locale',
    supportedLanguages: ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'],
    fallbackLanguage: 'ko',
    caches: false,
  }),
)

app.route('/', appRoutes)

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  ...app,
  port: Number(process.env.PORT ?? 8080),
  hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
}
