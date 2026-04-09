import { Hono } from 'hono'

import { Env } from '@/backend'

import twoFactorPostRoute from './2fa/POST'
import postRoute from './POST'

const route = new Hono<Env>()

route.route('/', postRoute)
route.route('/2fa', twoFactorPostRoute)

export default route
