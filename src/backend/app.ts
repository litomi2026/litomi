import { Hono } from 'hono'
import { timeout } from 'hono/timeout'
import ms from 'ms'

import { Env } from '@/backend'
import { checkDatabaseReadiness } from '@/database/supabase/drizzle'

import apiRoutes from './api'
import imageRoutes from './i'

const appRoutes = new Hono<Env>()

appRoutes.route('/api', apiRoutes)
appRoutes.route('/i', imageRoutes)

appRoutes.get('/health', timeout(ms('1 seconds')), (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date(),
  }),
)

appRoutes.get('/ready', timeout(ms('2 seconds')), async (c) => {
  try {
    const readiness = await checkDatabaseReadiness()

    if (!readiness.connected) {
      return c.json({ status: 'error', timestamp: new Date() }, 503)
    }

    return c.json({
      status: 'ready',
      database: {
        checkedAt: readiness.checkedAt,
        connected: true,
      },
      timestamp: new Date(),
    })
  } catch (error) {
    console.error(error)
    return c.json({ status: 'error', timestamp: new Date() }, 503)
  }
})

export default appRoutes
