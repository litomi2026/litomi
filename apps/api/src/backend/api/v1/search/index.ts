import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import suggestionRoutes from './suggestion'
import trendingRoutes from './trending'

const searchRoutes = new Hono<Env>()

searchRoutes.route('/suggestions', suggestionRoutes)
searchRoutes.route('/trending', trendingRoutes)

export default searchRoutes
