import { Hono } from 'hono'

import type { Env } from '@/app'

import deleteRoute from './DELETE'
import patchRoute from './PATCH'

const route = new Hono<Env>()

route.route('/', patchRoute)
route.route('/', deleteRoute)

export default route
