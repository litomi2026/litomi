import { Hono } from 'hono'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'

import copyRoutes from './copy'
import deleteRoutes from './DELETE'
import moveRoutes from './move'
import postRoutes from './POST'

const route = new Hono<Env>()

route.use('*', requireAuth)
route.route('/', postRoutes)
route.route('/', deleteRoutes)
route.route('/copy', copyRoutes)
route.route('/move', moveRoutes)

export default route
