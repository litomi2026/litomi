import { Hono } from 'hono'

import type { Env } from '@/app'

import clearanceRoute from './clearance'

const turnstileRoutes = new Hono<Env>()

turnstileRoutes.route('/clearance', clearanceRoute)

export default turnstileRoutes
