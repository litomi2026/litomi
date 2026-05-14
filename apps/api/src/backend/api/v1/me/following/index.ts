import { Hono } from 'hono'

import { Env } from '@/backend'

import getRoute from './GET'

const route = new Hono<Env>()

route.route('/', getRoute)

export default route
