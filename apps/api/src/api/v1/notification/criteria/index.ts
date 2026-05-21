import { Hono } from 'hono'

import type { Env } from '@/app'

import idRoutes from './[id]'
import postRoutes from './POST'

const criteriaRoutes = new Hono<Env>()

criteriaRoutes.route('/', postRoutes)
criteriaRoutes.route('/:id', idRoutes)

export default criteriaRoutes
