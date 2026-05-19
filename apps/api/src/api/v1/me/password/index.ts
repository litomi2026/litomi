import { Hono } from 'hono'

import type { Env } from '@/app'

import patchRoute from './PATCH'

const route = new Hono<Env>()

route.route('/', patchRoute)

export default route
