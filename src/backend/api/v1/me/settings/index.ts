import { Hono } from 'hono'

import { Env } from '@/backend'

import patchRoute from './PATCH'

const route = new Hono<Env>()

route.route('/', patchRoute)

export default route
