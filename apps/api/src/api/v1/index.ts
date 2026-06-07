import { Hono } from 'hono'

import type { Env } from '@/app'

import adsterraRoutes from './adsterra'
import analyticsRoutes from './analytics'
import authRoutes from './auth'
import bbatonRoutes from './bbaton'
import bookmarkRoutes from './bookmark'
import censorshipRoutes from './censorship'
import dmcaRoutes from './dmca'
import libraryRoutes from './library'
import mangaRoutes from './manga'
import meRoutes from './me'
import notificationRoutes from './notification'
import pointsRoutes from './points'
import postRoutes from './post'
import searchRoutes from './search'
import tagRoutes from './tag'
import turnstileRoutes from './turnstile'
import userRoutes from './user'

const v1Routes = new Hono<Env>()

v1Routes.route('/adsterra', adsterraRoutes)
v1Routes.route('/analytics', analyticsRoutes)
v1Routes.route('/auth', authRoutes)
v1Routes.route('/bbaton', bbatonRoutes)
v1Routes.route('/bookmark', bookmarkRoutes)
v1Routes.route('/censorship', censorshipRoutes)
v1Routes.route('/dmca', dmcaRoutes)
v1Routes.route('/library', libraryRoutes)
v1Routes.route('/manga', mangaRoutes)
v1Routes.route('/me', meRoutes)
v1Routes.route('/notification', notificationRoutes)
v1Routes.route('/points', pointsRoutes)
v1Routes.route('/post', postRoutes)
v1Routes.route('/search', searchRoutes)
v1Routes.route('/tag', tagRoutes)
v1Routes.route('/turnstile', turnstileRoutes)
v1Routes.route('/user', userRoutes)

export default v1Routes
