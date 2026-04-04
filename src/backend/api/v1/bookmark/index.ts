import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'

import bookmarkIdDeleteRoute from './[id]/DELETE'
import bookmarkIdPutRoute from './[id]/PUT'
import bookmarkDeleteRoute from './DELETE'
import exportBookmarksRoute from './export'
import getBookmarksRoute from './GET'
import getBookmarkIdsRoute from './id'
import importBookmarksRoute from './import'
import postBookmarksRoute from './POST'

const bookmarkRoutes = new Hono<Env>()

bookmarkRoutes.route('/', getBookmarksRoute)
bookmarkRoutes.route('/', bookmarkDeleteRoute)
bookmarkRoutes.route('/', postBookmarksRoute)
bookmarkRoutes.route('/id', getBookmarkIdsRoute)
bookmarkRoutes.route('/export', exportBookmarksRoute)
bookmarkRoutes.route('/import', importBookmarksRoute)
bookmarkRoutes.route('/:id', bookmarkIdPutRoute)
bookmarkRoutes.route('/:id', bookmarkIdDeleteRoute)

export default bookmarkRoutes
