import { Hono } from 'hono'

import type { Env } from '@/app'

import trendingViewPostRoutes from './POST'

const trendingViewRoutes = new Hono<Env>()

trendingViewRoutes.route('/', trendingViewPostRoutes)

export default trendingViewRoutes
