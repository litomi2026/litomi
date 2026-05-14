import { Hono } from 'hono'

import { Env } from '@/backend'

import postRoutes from './POST'

const criteriaRoutes = new Hono<Env>()

criteriaRoutes.route('/', postRoutes)

export default criteriaRoutes
