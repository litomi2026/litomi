import { Hono } from 'hono'

import { Env } from '@/backend'

import attemptRoute from './attempt'
import completeRoute from './complete'
import eventsRoute from './events'
import unlinkRoute from './unlink'

const bbatonRoutes = new Hono<Env>()

bbatonRoutes.route('/attempt', attemptRoute)
bbatonRoutes.route('/complete', completeRoute)
bbatonRoutes.route('/events', eventsRoute)
bbatonRoutes.route('/unlink', unlinkRoute)

export default bbatonRoutes
