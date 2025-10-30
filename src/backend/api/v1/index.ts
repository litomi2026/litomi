import { Hono } from 'hono'

import { Env } from '@/backend'

import bookmarkRoutes from './bookmark'
import censorshipRoutes from './censorship'
import mangaRoutes from './manga/[id]/history'
import meRoutes from './me'
import searchRoutes from './search'

const v1Routes = new Hono<Env>()

v1Routes.route('/bookmark', bookmarkRoutes)
v1Routes.route('/censorship', censorshipRoutes)
v1Routes.route('/manga', mangaRoutes)
v1Routes.route('/me', meRoutes)
v1Routes.route('/search', searchRoutes)

export default v1Routes
