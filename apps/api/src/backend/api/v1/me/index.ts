import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import { requireAuth } from '@/backend/middleware/require-auth'

import deleteRoute from './DELETE'
import followingRoutes from './following'
import getRoute from './GET'
import passwordRoutes from './password'
import patchRoute from './PATCH'
import sessionRoutes from './session'
import settingsRoutes from './settings'

const route = new Hono<Env>()

route.use('*', requireAuth)
route.route('/', getRoute)
route.route('/', patchRoute)
route.route('/', deleteRoute)
route.route('/password', passwordRoutes)
route.route('/following', followingRoutes)
route.route('/session', sessionRoutes)
route.route('/settings', settingsRoutes)

export default route
