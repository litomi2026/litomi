import { Hono } from 'hono'

import { Env } from '@/backend'

import imageProxyV1Routes from './v1/image-proxy'
import imageProxyV2Routes from './v2/image-proxy'

const imageRoutes = new Hono<Env>()

imageRoutes.route('/v1', imageProxyV1Routes)
imageRoutes.route('/v2', imageProxyV2Routes)

export default imageRoutes
