import { Hono } from 'hono'

import { Env } from '@/backend'

import postRoute from './POST'

export type { POSTV1AuthSignupRequest, POSTV1AuthSignupResponse } from './POST'

const route = new Hono<Env>()

route.route('/', postRoute)

export default route
