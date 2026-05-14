import { Hono } from 'hono'

import { Env } from '@/backend'

import userIdFollowRoutes from './[id]/follow'

const route = new Hono<Env>()

route.route('/:id/follow', userIdFollowRoutes)

export default route
