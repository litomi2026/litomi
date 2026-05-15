import { Hono } from 'hono'

import type { Env } from '@/app'

import deleteRoute from './DELETE'
import getRoute from './GET'

const route = new Hono<Env>()

route.route('/', getRoute)
route.route('/', deleteRoute)

export default route
