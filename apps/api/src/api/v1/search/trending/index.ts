import { Hono } from 'hono'

import type { Env } from '@/app'

import trendingGetRoutes from './GET'
import trendingViewRoutes from './view'

const trendingRoutes = new Hono<Env>()

trendingRoutes.route('/', trendingGetRoutes)
trendingRoutes.route('/view', trendingViewRoutes)

export default trendingRoutes
