import { Hono } from 'hono'

import { Env } from '@/backend'

import trendingGetRoutes from './GET'
import trendingPostRoutes from './POST'

const trendingRoutes = new Hono<Env>()

trendingRoutes.route('/', trendingGetRoutes)
trendingRoutes.route('/', trendingPostRoutes)

export default trendingRoutes
