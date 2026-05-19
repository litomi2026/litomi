import { db } from '@litomi/db/database/app/drizzle'
import { notificationTable } from '@litomi/db/database/app/notification'
import { createCacheControl } from '@litomi/http/cache-control'
import { and, count, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

export type GETUnreadCountResponse = number

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

    return c.json<GETUnreadCountResponse>(unreadCount, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '알림을 불러오지 못했어요' })
  }
})

export default unreadCountRoutes
