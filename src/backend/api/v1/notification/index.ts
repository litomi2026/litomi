import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { NOTIFICATION_PER_PAGE } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import { NotificationType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { notificationTable } from '@/database/supabase/schema'

import { NotificationFilter } from './types'
import unreadCountRoutes from './unread-count'

const querySchema = z.object({
  nextId: z.coerce.number().optional(),
  filter: z.array(z.enum(NotificationFilter)).optional(),
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

notificationRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  const { nextId, filter: filters } = c.req.valid('query')
  const conditions = [eq(notificationTable.userId, userId)]

  if (nextId) {
    conditions.push(lt(notificationTable.id, nextId))
  }

  if (filters?.includes(NotificationFilter.UNREAD)) {
    conditions.push(eq(notificationTable.read, false))
  }

  if (filters?.includes(NotificationFilter.NEW_MANGA)) {
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

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 3,
  })

  return c.json(result, { headers: { 'Cache-Control': cacheControl } })
})

notificationRoutes.route('/unread-count', unreadCountRoutes)

export default notificationRoutes
