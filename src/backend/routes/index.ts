import { Env, Hono } from 'hono'

import v1Routes from './v1'

const apiRoutes = new Hono<Env>()

apiRoutes.route('/v1', v1Routes)
apiRoutes.get('/', (c) => c.json({ endpoints: ['/v1', '/health', '/ready'] }))

export default apiRoutes
