import { and, count, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import 'server-only'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { notificationTable } from '@/database/supabase/notification'

export type GETUnreadCountResponse = number

const unreadCountRoutes = new Hono<Env>()

unreadCountRoutes.get('/', async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  const [{ count: unreadCount }] = await db
    .select({ count: count(notificationTable.id) })
    .from(notificationTable)
    .where(and(eq(notificationTable.userId, userId), eq(notificationTable.read, false)))

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 10,
  })

  return c.json<GETUnreadCountResponse>(unreadCount, { headers: { 'Cache-Control': cacheControl } })
})

export default unreadCountRoutes
