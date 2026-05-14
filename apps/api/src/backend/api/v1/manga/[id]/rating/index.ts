import { Hono } from 'hono'

import { Env } from '@/backend'

import deleteRoute from './DELETE'
import getRoute from './GET'
import putRoute from './PUT'

const route = new Hono<Env>()

route.route('/', getRoute)
route.route('/', putRoute)
route.route('/', deleteRoute)

export default route
