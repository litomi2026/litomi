import { Hono } from 'hono'

import { Env } from '@/backend'

import suggestionRoutes from './suggestion'

const searchRoutes = new Hono<Env>()

searchRoutes.route('/suggestions', suggestionRoutes)

export default searchRoutes
