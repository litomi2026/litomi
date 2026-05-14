import { Hono } from 'hono'

import type { Env } from '@/backend/app'

import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'

import criteriaRoutes from './criteria'
import deleteRoutes from './DELETE'
import getRoutes from './GET'
import patchRoutes from './PATCH'
import unreadCountRoutes from './unread-count'

const notificationRoutes = new Hono<Env>()

notificationRoutes.use('*', requireAuth, requireAdult)
notificationRoutes.route('/', getRoutes)
notificationRoutes.route('/', patchRoutes)
notificationRoutes.route('/', deleteRoutes)
notificationRoutes.route('/criteria', criteriaRoutes)
notificationRoutes.route('/unread-count', unreadCountRoutes)

export default notificationRoutes
