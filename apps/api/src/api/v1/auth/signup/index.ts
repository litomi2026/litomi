import { Hono } from 'hono'

import type { Env } from '@/app'

import postRoute from './POST'

export type { POSTV1AuthSignupRequest, POSTV1AuthSignupResponse } from '@litomi/contracts'

const route = new Hono<Env>()

route.route('/', postRoute)

export default route
