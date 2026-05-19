import { Hono } from 'hono'

import type { Env } from '@/app'

import idDeleteRoute from './[id]/DELETE'
import allDeleteRoute from './all/DELETE'
import othersDeleteRoute from './others/DELETE'

const route = new Hono<Env>()

route.route('/all', allDeleteRoute)
route.route('/others', othersDeleteRoute)
route.route('/:id', idDeleteRoute)

export default route
