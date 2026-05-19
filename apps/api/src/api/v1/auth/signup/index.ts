import { Hono } from 'hono'

import type { Env } from '@/app'

import postRoute from './POST'

const route = new Hono<Env>()

route.route('/', postRoute)

export default route
