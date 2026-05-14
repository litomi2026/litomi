import { Hono } from 'hono'

import type { Env } from '@/app'

import deleteRoutes from './DELETE'
import getRoutes from './GET'
import postRoutes from './POST'

const route = new Hono<Env>()

route.route('/', postRoutes)
route.route('/', getRoutes)
route.route('/', deleteRoutes)

export default route
