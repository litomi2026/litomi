import { Env, Hono } from 'hono'

import meRoutes from './me'

const v1Routes = new Hono<Env>()

v1Routes.route('/me', meRoutes)
v1Routes.get('/', (c) => c.json({ endpoints: ['/me'] }))

export default v1Routes
