import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/adult'
import { requireAuth } from '@/middleware/require-auth'

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
