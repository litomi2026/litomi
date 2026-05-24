import { Hono } from 'hono'

import type { Env } from '@/app'

import loginRoutes from './login'
import logoutRoutes from './logout'
import passkeyRoutes from './passkey'
import refreshRoutes from './refresh'
import signupRoutes from './signup'

const authRoutes = new Hono<Env>()

authRoutes.route('/login', loginRoutes)
authRoutes.route('/logout', logoutRoutes)
authRoutes.route('/passkey', passkeyRoutes)
authRoutes.route('/refresh', refreshRoutes)
authRoutes.route('/signup', signupRoutes)

export default authRoutes
