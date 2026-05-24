import { Hono } from 'hono'

import type { Env } from '@/app'

import idDeleteRoute from './[id]/DELETE'
import idPatchRoute from './[id]/PATCH'
import optionsRoutes from './options'
import verifyRoutes from './verify'

const route = new Hono<Env>()

route.route('/options', optionsRoutes)
route.route('/verify', verifyRoutes)
route.route('/:id', idDeleteRoute)
route.route('/:id', idPatchRoute)

export default route
