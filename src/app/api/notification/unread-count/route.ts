import { and, count, eq, sql } from 'drizzle-orm'

import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { notificationTable } from '@/database/schema'
import { getUserIdFromCookie } from '@/utils/session'

export async function GET(request: Request) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const [{ count: unreadCount }] = await db
      .select({ count: count(notificationTable.id) })
      .from(notificationTable)
      .where(and(sql`${notificationTable.userId} = ${userId}`, eq(notificationTable.read, false)))

    const cacheControl = createCacheControl({
      private: true,
      maxAge: 10,
      swr: 10,
    })

    return Response.json(unreadCount, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
