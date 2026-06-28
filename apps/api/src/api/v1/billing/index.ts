import { Hono } from 'hono'

import type { Env } from '@/app'

import postRoute from './POST'
import webhookRoute from './webhook'

const billingRoutes = new Hono<Env>()

billingRoutes.route('/', postRoute)
billingRoutes.route('/', webhookRoute)

export default billingRoutes
