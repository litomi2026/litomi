import { Hono } from 'hono'

import { Env } from '@/backend'

import getRoute from './GET'
import postRoute from './POST'

const route = new Hono<Env>()

route.route('/', getRoute)
route.route('/', postRoute)

export default route
