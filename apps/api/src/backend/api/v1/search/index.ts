import { Hono } from 'hono'

import { Env } from '@/backend'

import suggestionRoutes from './suggestion'
import trendingRoutes from './trending'

const searchRoutes = new Hono<Env>()

searchRoutes.route('/suggestions', suggestionRoutes)
searchRoutes.route('/trending', trendingRoutes)

export default searchRoutes
