import { Hono } from 'hono'

import { Env } from '@/backend'

import imageProxyV2Routes from './v2/image-proxy'

const imageRoutes = new Hono<Env>()

imageRoutes.route('/v2', imageProxyV2Routes)

export default imageRoutes
