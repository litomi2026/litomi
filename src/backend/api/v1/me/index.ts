import { Hono } from 'hono'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'

import getRoute from './GET'
import settingsRoutes from './settings/index'

const route = new Hono<Env>()

route.use('*', requireAuth)
route.route('/', getRoute)
route.route('/settings', settingsRoutes)

export default route
