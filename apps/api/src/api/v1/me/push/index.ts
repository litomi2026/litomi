import { Hono } from 'hono'

import type { Env } from '@/app'

import settingsRoutes from './settings'
import subscriptionRoutes from './subscription'
import testRoutes from './test'

const route = new Hono<Env>()

route.route('/settings', settingsRoutes)
route.route('/subscription', subscriptionRoutes)
route.route('/test', testRoutes)

export default route
