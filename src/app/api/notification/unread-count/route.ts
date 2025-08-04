import { count, sql } from 'drizzle-orm'

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
    const [unreadNotifications] = await db
      .select({ count: count(notificationTable.id) })
      .from(notificationTable)
      .where(sql`${notificationTable.userId} = ${userId} AND ${notificationTable.read} = 0`)

    return Response.json(unreadNotifications.count)
  } catch (error) {
    return handleRouteError(error, request)
  }
}
