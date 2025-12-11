import { Hono } from 'hono'

import { Env } from '@/backend'

import analyticsRoutes from './analytics'
import bookmarkRoutes from './bookmark'
import censorshipRoutes from './censorship'
import libraryRoutes from './library'
import mangaRoutes from './manga/[id]/history'
import meRoutes from './me'
import notificationRoutes from './notification'
import pointsRoutes from './points'
import postRoutes from './post'
import searchRoutes from './search'
import tagRoutes from './tag'

const v1Routes = new Hono<Env>()

v1Routes.route('/analytics', analyticsRoutes)
v1Routes.route('/bookmark', bookmarkRoutes)
v1Routes.route('/censorship', censorshipRoutes)
v1Routes.route('/library', libraryRoutes)
v1Routes.route('/manga', mangaRoutes)
v1Routes.route('/me', meRoutes)
v1Routes.route('/notification', notificationRoutes)
v1Routes.route('/points', pointsRoutes)
v1Routes.route('/post', postRoutes)
v1Routes.route('/search', searchRoutes)
v1Routes.route('/tag', tagRoutes)

export default v1Routes
