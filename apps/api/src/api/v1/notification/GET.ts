import type { GETV1NotificationResponse } from '@litomi/contracts'

import { getV1NotificationQuerySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { notificationTable } from '@litomi/db/app/notification'
import { NotificationFilter } from '@litomi/domain/notification/filter'
import { NotificationType } from '@litomi/domain/notification/model'
import { NOTIFICATION_PER_PAGE } from '@litomi/domain/notification/policy'
import { and, desc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.get('/', zProblemValidator('query', getV1NotificationQuerySchema), async (c) => {
  const userId = c.get('userId')!

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

    const result = {
      notifications: results.slice(0, NOTIFICATION_PER_PAGE),
      hasNextPage: results.length > NOTIFICATION_PER_PAGE,
    } satisfies GETV1NotificationResponse

    return c.json(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '알림을 불러오지 못했어요' })
  }
})

export default route
