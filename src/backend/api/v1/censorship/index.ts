import { Hono } from 'hono'

import { Env } from '@/backend'

import deleteRoutes from './DELETE'
import getRoutes from './GET'
import patchRoutes from './PATCH'
import postRoutes from './POST'

const route = new Hono<Env>()

route.route('/', getRoutes)
route.route('/', postRoutes)
route.route('/', patchRoutes)
route.route('/', deleteRoutes)

export default route
