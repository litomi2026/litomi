import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import userIdFollowRoutes from './[id]/follow'

const route = new Hono<Env>()

route.route('/:id/follow', userIdFollowRoutes)

export default route
