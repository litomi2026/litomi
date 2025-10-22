import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { getConnInfo } from 'hono/bun'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { etag } from 'hono/etag'
import { ipRestriction } from 'hono/ip-restriction'
import { jwt } from 'hono/jwt'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { endTime, setMetric, startTime, timing } from 'hono/timing'

import { CANONICAL_URL } from '@/constants'
import { CORS_ORIGIN, JWT_SECRET_ACCESS_TOKEN } from '@/constants/env'
import { CookieKey } from '@/constants/storage'
import { db } from '@/database/supabase/drizzle'

import { authMiddleware as auth } from './middleware/auth'

const url = new URL(CANONICAL_URL)

export type Env = {
  Variables: {
    requestId: string
    userId?: number
  }
}

const app = new Hono<Env>()

app.use('*', cors({ origin: CORS_ORIGIN }))
app.use('*', ipRestriction(getConnInfo, { denyList: [] }))
app.use('*', requestId())
// app.use(compress()) // NOTE: This middleware uses CompressionStream which is not yet supported in Bun.
app.use(contextStorage())
app.use(csrf({ origin: CORS_ORIGIN, secFetchSite: 'same-site' }))
app.use(logger())
app.use(secureHeaders())
app.use(timing())

app.use('/api/*', auth())
app.use('/api/*', etag())

app.use(
  '/api/*',
  jwt({
    cookie: CookieKey.ACCESS_TOKEN,
    secret: JWT_SECRET_ACCESS_TOKEN,
    verification: { iss: url.hostname },
  }),
)

// app.route('/api', apiRoutes)

app.get('/', (c) => {
  startTime(c, 'bar')
  endTime(c, 'bar')
  setMetric(c, 'foo', 1, 'hello world!')

  return c.json({ requestId: c.get('requestId') })
})

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date(),
  }),
)

app.get('/ready', async (c) => {
  try {
    const [result] = await db.execute<{ current_time: Date; version: string; connection: number }>(sql`
      SELECT 
        CURRENT_TIMESTAMP as current_time,
        version() as version,
        1 as connection
    `)

    if (!result) {
      return c.json({ status: 'error', timestamp: new Date() }, 503)
    }

    return c.json({
      status: 'ready',
      database: {
        connected: true,
        time: result.current_time,
        version: result.version,
      },
      timestamp: new Date(),
    })
  } catch {
    return c.json({ status: 'error', timestamp: new Date() }, 503)
  }
})

// app.onError(errorHandler)

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  ...app,
  port: Number(process.env.PORT ?? 8080),
  hostname: '0.0.0.0',
}
