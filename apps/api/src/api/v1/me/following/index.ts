import { Hono } from 'hono'

import type { Env } from '@/app'

import getRoute from './GET'

const route = new Hono<Env>()

route.route('/', getRoute)

export default route
