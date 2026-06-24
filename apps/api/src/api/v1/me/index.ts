import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'

import deleteRoute from './DELETE'
import exportRoutes from './export'
import followingRoutes from './following'
import getRoute from './GET'
import patchRoute from './PATCH'
import passkeyRoutes from './passkey'
import passwordRoutes from './password'
import pushRoutes from './push'
import sessionRoutes from './session'
import settingsRoutes from './settings'
import trustedBrowserRoutes from './trusted-browser'
import twoFactorRoutes from './two-factor'

const route = new Hono<Env>()

route.use('*', requireAuth)
route.route('/', getRoute)
route.route('/', patchRoute)
route.route('/', deleteRoute)
route.route('/export', exportRoutes)
route.route('/password', passwordRoutes)
route.route('/passkey', passkeyRoutes)
route.route('/push', pushRoutes)
route.route('/following', followingRoutes)
route.route('/session', sessionRoutes)
route.route('/settings', settingsRoutes)
route.route('/two-factor', twoFactorRoutes)
route.route('/trusted-browser', trustedBrowserRoutes)

export default route
