import { Hono } from 'hono'

import type { Env } from '@/app'

import optionsPostRoute from './options/POST'
import verifyPostRoute from './verify/POST'

const route = new Hono<Env>()

route.route('/options', optionsPostRoute)
route.route('/verify', verifyPostRoute)

export default route
