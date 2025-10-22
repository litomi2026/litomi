import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { db } from '@/database/supabase/drizzle'

// import v1Routes from './routes'

export type Env = {
  Variables: {
    requestId: string
    userId?: string
  }
}

const app = new Hono<Env>()

// app.use('*', requestId())
// app.use('*', timing())
// app.use('*', logger())
// app.use('*', secureHeaders())
// app.use('*', compress())
// app.use('*', cors())
// app.use('*', rateLimiter())

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
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
      return c.json({ status: 'error', timestamp: new Date().toISOString() }, 503)
    }

    return c.json({
      status: 'ready',
      database: {
        connected: true,
        time: result.current_time,
        version: result.version,
      },
      timestamp: new Date().toISOString(),
    })
  } catch {
    return c.json({ status: 'error', timestamp: new Date().toISOString() }, 503)
  }
})

// app.route('/', v1Routes)

// app.onError(errorHandler)

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  ...app,
  port: Number(process.env.PORT ?? 8080),
  hostname: '0.0.0.0',
}
