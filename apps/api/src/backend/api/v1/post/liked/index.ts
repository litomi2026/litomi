import { Hono } from 'hono'

import { Env } from '@/backend'

import getRoute from './GET'

export type { GETV1PostLikedResponse } from './GET'

const route = new Hono<Env>()

route.route('/', getRoute)

export default route
