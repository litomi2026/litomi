import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'

import libraryIdRoutes from './[id]/GET'
import libraryItemRoutes from './[id]/item/GET'
import libraryGetRoutes from './GET'
import libraryHistoryRoutes from './history'
import libraryMangaRoutes from './manga'
import libraryPostRoutes from './POST'
import libraryRatingRoutes from './rating'
import librarySummaryRoutes from './summary'

const libraryRoutes = new Hono<Env>()

libraryRoutes.route('/', libraryGetRoutes)
libraryRoutes.route('/', libraryPostRoutes)
libraryRoutes.route('/history', libraryHistoryRoutes)
libraryRoutes.route('/manga', libraryMangaRoutes)
libraryRoutes.route('/rating', libraryRatingRoutes)
libraryRoutes.route('/summary', librarySummaryRoutes)
libraryRoutes.route('/:id', libraryIdRoutes)
libraryRoutes.route('/:id/item', libraryItemRoutes)

export default libraryRoutes
