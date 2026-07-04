import type { GETV1NotificationUnreadCountResponse } from '@litomi/contracts'

import { db } from '@litomi/db/app'
import { notificationTable } from '@litomi/db/app/notification'
import { createCacheControl } from '@litomi/http/cache-control'
import { and, count, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

const unreadCountRoutes = new Hono<Env>()

unreadCountRoutes.get('/', async (c) => {
  const userId = c.get('userId')!

  try {
    const [{ count: unreadCount }] = await db
      .select({ count: count(notificationTable.id) })
      .from(notificationTable)
      .where(and(eq(notificationTable.userId, userId), eq(notificationTable.read, false)))

    const cacheControl = createCacheControl({
      private: true,
      maxAge: 10,
    })

    const response = unreadCount satisfies GETV1NotificationUnreadCountResponse

    return c.json(response, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default unreadCountRoutes
