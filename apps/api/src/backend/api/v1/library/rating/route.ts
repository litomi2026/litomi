import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import deleteRoute from './DELETE'
import getRoute from './GET'

const route = new Hono<Env>()

route.route('/', getRoute)
route.route('/', deleteRoute)

export default route
