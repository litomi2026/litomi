import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import mangaHistoryRoutes from './[id]/history'
import mangaRatingRoutes from './[id]/rating'
import mangaReportRoutes from './[id]/report'

const mangaRoutes = new Hono<Env>()

mangaRoutes.route('/', mangaHistoryRoutes)
mangaRoutes.route('/', mangaRatingRoutes)
mangaRoutes.route('/', mangaReportRoutes)

export default mangaRoutes
