import { Hono } from 'hono'

import type { Env } from '@/app'

import realtimeRoutes from './realtime'

const analyticsRoutes = new Hono<Env>()

analyticsRoutes.route('/realtime', realtimeRoutes)

export default analyticsRoutes
