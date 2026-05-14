import { Hono } from 'hono'

import type { Env } from '@/backend'

import apiRoutes from './api'
import imageRoutes from './i'

const appRoutes = new Hono<Env>()

appRoutes.route('/api', apiRoutes)
appRoutes.route('/i', imageRoutes)

export default appRoutes
