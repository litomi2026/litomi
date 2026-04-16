import { Hono } from 'hono'

import { Env } from '@/backend'

import patchRoute from './PATCH'

export type { PATCHV1MePasswordBody, PATCHV1MePasswordResponse } from './PATCH'

const route = new Hono<Env>()

route.route('/', patchRoute)

export default route
