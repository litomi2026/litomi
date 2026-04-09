import { Hono } from 'hono'

import { Env } from '@/backend'

import loginRoutes from './login'
import logoutRoutes from './logout'
import passkeyRoutes from './passkey'
import signupRoutes from './signup'

const authRoutes = new Hono<Env>()

authRoutes.route('/login', loginRoutes)
authRoutes.route('/logout', logoutRoutes)
authRoutes.route('/passkey', passkeyRoutes)
authRoutes.route('/signup', signupRoutes)

export default authRoutes
