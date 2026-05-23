import { Hono } from 'hono'

import type { Env } from '@/app'

import idDeleteRoute from './[id]/DELETE'
import allDeleteRoute from './all/DELETE'

const route = new Hono<Env>()

route.route('/all', allDeleteRoute)
route.route('/:id', idDeleteRoute)

export default route
