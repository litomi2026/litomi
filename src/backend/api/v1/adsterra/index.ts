import { Hono } from 'hono'

import { Env } from '@/backend'

import statsRoute from './stats'

const adsterraRoutes = new Hono<Env>()

adsterraRoutes.route('/', statsRoute)

export default adsterraRoutes
