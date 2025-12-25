import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'

import getBookmarksRoute from './get'
import importBookmarksRoute from './import'
import toggleBookmarkRoute from './toggle'

const bookmarkRoutes = new Hono<Env>()

bookmarkRoutes.route('/', getBookmarksRoute)
bookmarkRoutes.route('/toggle', toggleBookmarkRoute)
bookmarkRoutes.route('/import', importBookmarksRoute)

export default bookmarkRoutes
