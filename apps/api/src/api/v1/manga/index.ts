import { Hono } from 'hono'

import type { Env } from '@/app'

import mangaHistoryRoutes from './[id]/history'
import mangaRatingRoutes from './[id]/rating'
import mangaReportRoutes from './[id]/report'
import mangaRecommendationRoutes from './recommendation'

const mangaRoutes = new Hono<Env>()

mangaRoutes.route('/recommendation', mangaRecommendationRoutes)
mangaRoutes.route('/', mangaHistoryRoutes)
mangaRoutes.route('/', mangaRatingRoutes)
mangaRoutes.route('/', mangaReportRoutes)

export default mangaRoutes
