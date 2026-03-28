import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'

import libraryIdDeleteRoutes from './[id]/DELETE'
import libraryIdRoutes from './[id]/GET'
import libraryIdItemRoutes from './[id]/item/GET'
import libraryIdPatchRoutes from './[id]/PATCH'
import libraryPinDeleteRoutes from './[id]/pin/DELETE'
import libraryPinPostRoutes from './[id]/pin/POST'
import libraryGetRoutes from './GET'
import libraryHistoryRoutes from './history'
import libraryItemRoutes from './item'
import libraryMangaRoutes from './manga'
import libraryPostRoutes from './POST'
import libraryRatingRoutes from './rating/route'
import librarySummaryRoutes from './summary'

const libraryRoutes = new Hono<Env>()

libraryRoutes.route('/', libraryGetRoutes)
libraryRoutes.route('/', libraryPostRoutes)
libraryRoutes.route('/history', libraryHistoryRoutes)
libraryRoutes.route('/item', libraryItemRoutes)
libraryRoutes.route('/manga', libraryMangaRoutes)
libraryRoutes.route('/rating', libraryRatingRoutes)
libraryRoutes.route('/summary', librarySummaryRoutes)
libraryRoutes.route('/:id', libraryIdRoutes)
libraryRoutes.route('/:id', libraryIdPatchRoutes)
libraryRoutes.route('/:id', libraryIdDeleteRoutes)
libraryRoutes.route('/:id/item', libraryIdItemRoutes)
libraryRoutes.route('/:id/pin', libraryPinPostRoutes)
libraryRoutes.route('/:id/pin', libraryPinDeleteRoutes)

export default libraryRoutes
