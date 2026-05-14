import { Hono } from 'hono'

import { Env } from '@/backend'

import realtimeRoutes from './realtime'

const analyticsRoutes = new Hono<Env>()

analyticsRoutes.route('/realtime', realtimeRoutes)

export default analyticsRoutes
