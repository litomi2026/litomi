import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'

import deleteRoutes from './DELETE'
import getRoutes from './GET'
import patchRoutes from './PATCH'
import postRoutes from './POST'

const route = new Hono<Env>()

route.use('*', requireAuth, requireAdult)
route.route('/', getRoutes)
route.route('/', postRoutes)
route.route('/', patchRoutes)
route.route('/', deleteRoutes)

export default route
