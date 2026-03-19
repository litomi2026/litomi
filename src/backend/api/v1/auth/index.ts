import { Hono } from 'hono'

import { Env } from '@/backend'

import logoutRoutes from './logout'

const authRoutes = new Hono<Env>()

authRoutes.route('/logout', logoutRoutes)

export default authRoutes
