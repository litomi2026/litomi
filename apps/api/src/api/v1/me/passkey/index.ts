import { Hono } from 'hono'

import type { Env } from '@/app'

import idDeleteRoute from './[id]/DELETE'

const route = new Hono<Env>()

route.route('/:id', idDeleteRoute)

export default route
