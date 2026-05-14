import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import patchRoute from './PATCH'

const route = new Hono<Env>()

route.route('/', patchRoute)

export default route
