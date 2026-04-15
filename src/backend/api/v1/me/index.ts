import { Hono } from 'hono'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'

import deleteRoute from './DELETE'
import getRoute from './GET'
import patchRoute from './PATCH'
import sessionRoutes from './session'
import settingsRoutes from './settings'

const route = new Hono<Env>()

route.use('*', requireAuth)
route.route('/', getRoute)
route.route('/', patchRoute)
route.route('/', deleteRoute)
route.route('/session', sessionRoutes)
route.route('/settings', settingsRoutes)

export default route
