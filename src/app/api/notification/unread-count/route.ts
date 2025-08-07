import { and, count, eq, sql } from 'drizzle-orm'

import { handleRouteError } from '@/crawler/proxy-utils'
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

    return Response.json(unreadCount)
  } catch (error) {
    return handleRouteError(error, request)
  }
}
