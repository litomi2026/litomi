import { Hono } from 'hono'

import type { Env } from '@/app'

import setupRoutes from './setup'

const route = new Hono<Env>()

route.route('/setup', setupRoutes)

export default route
