import { and, desc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { NOTIFICATION_PER_PAGE } from '@/constants/policy'
import { NotificationType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { notificationTable } from '@/database/supabase/notification'

import { NotificationFilter } from './types'
import unreadCountRoutes from './unread-count'

const querySchema = z.object({
  nextId: z.coerce.number().optional(),
  filter: z.union([z.enum(NotificationFilter), z.array(z.enum(NotificationFilter))]).optional(),
})

export type GETNotificationResponse = {
  notifications: {
    id: number
    userId: number
    createdAt: Date
    type: number
    read: boolean
    title: string
    body: string
    data: string | null
    sentAt: Date | null
  }[]
  hasNextPage: boolean
}

const notificationRoutes = new Hono<Env>()

notificationRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  try {
    const { nextId, filter = [] } = c.req.valid('query')
    const filters = Array.isArray(filter) ? filter : [filter]
    const conditions = [eq(notificationTable.userId, userId)]

    if (nextId) {
      conditions.push(lt(notificationTable.id, nextId))
    }

    if (filters.includes(NotificationFilter.UNREAD)) {
      conditions.push(eq(notificationTable.read, false))
    }

    if (filters.includes(NotificationFilter.NEW_MANGA)) {
      conditions.push(eq(notificationTable.type, NotificationType.NEW_MANGA))
    }

    const results = await db
      .select()
      .from(notificationTable)
      .where(and(...conditions))
      .orderBy(desc(notificationTable.id))
      .limit(NOTIFICATION_PER_PAGE + 1)

    const result: GETNotificationResponse = {
      notifications: results.slice(0, NOTIFICATION_PER_PAGE),
      hasNextPage: results.length > NOTIFICATION_PER_PAGE,
    }
    return c.json<GETNotificationResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '알림을 불러오지 못했어요' })
  }
})

notificationRoutes.route('/unread-count', unreadCountRoutes)

export default notificationRoutes
