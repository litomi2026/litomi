import { Hono } from 'hono'

import { Env } from '@/backend'

import attemptRoute from './attempt'
import completeRoute from './complete'

const bbatonRoutes = new Hono<Env>()

bbatonRoutes.route('/attempt', attemptRoute)
bbatonRoutes.route('/complete', completeRoute)

export default bbatonRoutes
