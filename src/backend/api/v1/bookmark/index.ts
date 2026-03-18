import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'

import exportBookmarksRoute from './export'
import getBookmarksRoute from './GET'
import getBookmarkIdsRoute from './id'
import importBookmarksRoute from './import'
import toggleBookmarkRoute from './toggle'

const bookmarkRoutes = new Hono<Env>()

bookmarkRoutes.route('/', getBookmarksRoute)
bookmarkRoutes.route('/id', getBookmarkIdsRoute)
bookmarkRoutes.route('/export', exportBookmarksRoute)
bookmarkRoutes.route('/toggle', toggleBookmarkRoute)
bookmarkRoutes.route('/import', importBookmarksRoute)

export default bookmarkRoutes
