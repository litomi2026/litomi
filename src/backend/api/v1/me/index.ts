import { Hono } from 'hono'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'

import deleteRoute from './DELETE'
import getRoute from './GET'
import sessionRoutes from './session'
import settingsRoutes from './settings'

const route = new Hono<Env>()

route.use('*', requireAuth)
route.route('/', getRoute)
route.route('/', deleteRoute)
route.route('/session', sessionRoutes)
route.route('/settings', settingsRoutes)

export type { DELETEV1MeBody, DELETEV1MeResponse } from './DELETE'

export default route
