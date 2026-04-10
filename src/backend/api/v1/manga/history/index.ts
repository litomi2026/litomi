import { Hono } from 'hono'

import { Env } from '@/backend'

import importRoute from './import'

const route = new Hono<Env>()

route.route('/', importRoute)

export default route
