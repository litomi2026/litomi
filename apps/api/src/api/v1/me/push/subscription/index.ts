import { Hono } from 'hono'

import type { Env } from '@/app'

import idDeleteRoute from './[id]/DELETE'
import deleteRoute from './DELETE'
import postRoute from './POST'

const route = new Hono<Env>()

route.route('/', postRoute)
route.route('/', deleteRoute)
route.route('/:id', idDeleteRoute)

export default route
