import { Hono } from 'hono'

import { Env } from '@/backend'

import earnRoute from './earn'
import expansionRoute from './expansion'
import getPointsRoute from './GET'
import spendRoute from './spend'
import tokenRoute from './token'
import transactionsRoute from './transactions'
import turnstileRoute from './turnstile'

const pointsRoutes = new Hono<Env>()

pointsRoutes.route('/', getPointsRoute)
pointsRoutes.route('/earn', earnRoute)
pointsRoutes.route('/expansion', expansionRoute)
pointsRoutes.route('/spend', spendRoute)
pointsRoutes.route('/token', tokenRoute)
pointsRoutes.route('/turnstile', turnstileRoute)
pointsRoutes.route('/transactions', transactionsRoute)

export default pointsRoutes
