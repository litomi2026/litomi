import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import deleteRoute from './DELETE'
import getRoute from './GET'
import importRoute from './import'

const route = new Hono<Env>()

route.route('/', getRoute)
route.route('/', deleteRoute)
route.route('/', importRoute)

export default route
