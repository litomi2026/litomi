import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import v1Routes from './v1'

const apiRoutes = new Hono<Env>()

apiRoutes.route('/v1', v1Routes)

export default apiRoutes
