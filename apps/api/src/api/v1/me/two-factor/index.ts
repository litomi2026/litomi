import { Hono } from 'hono'

import type { Env } from '@/app'

import backupCodesRoutes from './backup-codes'
import deleteRoute from './DELETE'
import setupRoutes from './setup'
import verifyRoutes from './verify'

const route = new Hono<Env>()

route.route('/', deleteRoute)
route.route('/backup-codes', backupCodesRoutes)
route.route('/setup', setupRoutes)
route.route('/verify', verifyRoutes)

export default route
