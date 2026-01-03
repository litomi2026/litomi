import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'

import itemsRoutes from './[id]/GET'
import libraryGetRoutes from './GET'
import libraryHistoryRoutes from './history'
import libraryListRoutes from './list'
import libraryMangaRoutes from './manga'
import libraryMetaRoutes from './meta'
import libraryRatingRoutes from './rating'
import librarySummaryRoutes from './summary'

const libraryRoutes = new Hono<Env>()

libraryRoutes.route('/', libraryGetRoutes)
libraryRoutes.route('/list', libraryListRoutes)
libraryRoutes.route('/history', libraryHistoryRoutes)
libraryRoutes.route('/manga', libraryMangaRoutes)
libraryRoutes.route('/rating', libraryRatingRoutes)
libraryRoutes.route('/summary', librarySummaryRoutes)
libraryRoutes.route('/:id/meta', libraryMetaRoutes)
libraryRoutes.route('/:id', itemsRoutes)

export default libraryRoutes
