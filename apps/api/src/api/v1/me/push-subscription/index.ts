import { Hono } from 'hono'

import type { Env } from '@/app'

import idDeleteRoute from './[id]/DELETE'
import testPostRoute from './test/POST'

const route = new Hono<Env>()

route.route('/test', testPostRoute)
route.route('/:id', idDeleteRoute)

export default route
