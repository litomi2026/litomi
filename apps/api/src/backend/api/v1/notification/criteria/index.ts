import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import postRoutes from './POST'

const criteriaRoutes = new Hono<Env>()

criteriaRoutes.route('/', postRoutes)

export default criteriaRoutes
