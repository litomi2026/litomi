import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import twoFactorPostRoute from './2fa/POST'
import postRoute from './POST'

const route = new Hono<Env>()

route.route('/', postRoute)
route.route('/2fa', twoFactorPostRoute)

export default route
