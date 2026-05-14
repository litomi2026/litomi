import { Hono } from 'hono'

import type { Env } from '@/app'

import patchRoute from './PATCH'

export type { PATCHV1MePasswordBody, PATCHV1MePasswordResponse } from './PATCH'

const route = new Hono<Env>()

route.route('/', patchRoute)

export default route
