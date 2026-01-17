import { Hono } from 'hono'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'

import getRoutes from './GET'
import unreadCountRoutes from './unread-count'

const notificationRoutes = new Hono<Env>()

notificationRoutes.use('*', requireAuth, requireAdult)
notificationRoutes.route('/', getRoutes)
notificationRoutes.route('/unread-count', unreadCountRoutes)

export default notificationRoutes
