import { Env, Hono } from 'hono'

import meRoutes from './me'
import searchRoutes from './search'

const v1Routes = new Hono<Env>()

v1Routes.route('/me', meRoutes)
v1Routes.route('/search', searchRoutes)

export default v1Routes
