import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/adult'
import { requireAuth } from '@/middleware/require-auth'

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
