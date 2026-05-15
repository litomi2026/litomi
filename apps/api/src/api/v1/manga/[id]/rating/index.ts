import { Hono } from 'hono'

import type { Env } from '@/app'

import deleteRoute from './DELETE'
import getRoute from './GET'
import putRoute from './PUT'

const route = new Hono<Env>()

route.route('/', getRoute)
route.route('/', putRoute)
route.route('/', deleteRoute)

export default route
