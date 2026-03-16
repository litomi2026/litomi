import { Hono } from 'hono'
import { timeout } from 'hono/timeout'
import { endTime, setMetric, startTime } from 'hono/timing'
import ms from 'ms'
import { z } from 'zod'

import { Env } from '@/backend'
import { zProblemValidator } from '@/backend/utils/validator'
import { checkDatabaseReadiness } from '@/database/supabase/drizzle'

import apiRoutes from './api'
import imageRoutes from './i'

const appRoutes = new Hono<Env>()

appRoutes.route('/api', apiRoutes)
appRoutes.route('/i', imageRoutes)

const schema = z.object({
  name: z.string().optional(),
  age: z.coerce.number().optional(),
})

appRoutes.get('/', zProblemValidator('query', schema), (c) => {
  const { name, age } = c.req.valid('query')

  startTime(c, 'bar')
  endTime(c, 'bar')
  setMetric(c, 'foo', 1, 'hello world!')

  return c.json({
    requestId: c.get('requestId'),
    language: c.get('language'),
    name,
    age,
  })
})

appRoutes.use('/health', timeout(ms('1 seconds')))
appRoutes.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date(),
  }),
)

appRoutes.use('/ready', timeout(ms('2 seconds')))
appRoutes.get('/ready', async (c) => {
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
