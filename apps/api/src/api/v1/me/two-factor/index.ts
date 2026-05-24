import { Hono } from 'hono'

import type { Env } from '@/app'

import setupRoutes from './setup'
import verifyRoutes from './verify'

const route = new Hono<Env>()

route.route('/setup', setupRoutes)
route.route('/verify', verifyRoutes)

export default route
