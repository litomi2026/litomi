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
    const result = await db.execute(sql`
      SELECT 
        CURRENT_TIMESTAMP as current_time,
        version() as version,
        1 as connection
    `)

    if (!result || result.length === 0) {
      return c.json(
        {
          status: 'error',
          message: 'Database readiness check failed',
          timestamp: new Date().toISOString(),
        },
        503,
      )
    }

    const row = result[0]

    return c.json({
      status: 'ready',
      database: {
        connected: true,
        serverTime: row.currentTime,
        version: row.version,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Database readiness check failed:', error)

    return c.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error:
          process.env.NODE_ENV !== 'production'
            ? error instanceof Error
              ? error.message
              : 'Unknown error'
            : undefined,
        timestamp: new Date().toISOString(),
      },
      503,
    )
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
