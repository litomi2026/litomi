import { Hono } from 'hono'

import type { Env } from '@/app'

import imageProxyV2Routes from './v2/image-proxy'

const imageRoutes = new Hono<Env>()

imageRoutes.route('/v2', imageProxyV2Routes)

export default imageRoutes
