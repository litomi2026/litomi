import { Hono } from 'hono'

import { Env } from '@/backend'

import mangaHistoryRoutes from './[id]/history'
import mangaRatingRoutes from './[id]/rating'

const mangaRoutes = new Hono<Env>()

mangaRoutes.route('/', mangaHistoryRoutes)
mangaRoutes.route('/', mangaRatingRoutes)

export default mangaRoutes
