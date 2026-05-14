import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import statsRoute from './stats'

const adsterraRoutes = new Hono<Env>()

adsterraRoutes.route('/', statsRoute)

export default adsterraRoutes
