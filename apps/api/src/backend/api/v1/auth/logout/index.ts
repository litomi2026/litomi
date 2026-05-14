import { Hono } from 'hono'

import { Env } from '@/backend'

import postRoute from './POST'

export type { POSTV1AuthLogoutResponse } from './POST'

const route = new Hono<Env>()

route.route('/', postRoute)

export default route
