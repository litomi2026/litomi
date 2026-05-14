import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import getRoute from './GET'

const route = new Hono<Env>()

route.route('/', getRoute)

export default route
