import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import attemptRoute from './attempt'
import completeRoute from './complete'
import unlinkRoute from './unlink'

const bbatonRoutes = new Hono<Env>()

bbatonRoutes.route('/attempt', attemptRoute)
bbatonRoutes.route('/complete', completeRoute)
bbatonRoutes.route('/unlink', unlinkRoute)

export default bbatonRoutes
