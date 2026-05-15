import { Hono } from 'hono'

import type { Env } from '@/app'

import statsRoute from './stats'

const adsterraRoutes = new Hono<Env>()

adsterraRoutes.route('/', statsRoute)

export default adsterraRoutes
