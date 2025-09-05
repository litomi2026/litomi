import { and, count, eq } from 'drizzle-orm'

import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { notificationTable } from '@/database/schema'
import { validateUserIdFromCookie } from '@/utils/cookie'

export async function GET(request: Request) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const [{ count: unreadCount }] = await db
      .select({ count: count(notificationTable.id) })
      .from(notificationTable)
      .where(and(eq(notificationTable.userId, userId), eq(notificationTable.read, false)))

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
