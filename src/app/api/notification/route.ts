import { and, desc, eq, lt } from 'drizzle-orm'

import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { NotificationType } from '@/database/enum'
import { notificationTable } from '@/database/schema'
import { validateUserIdFromCookie } from '@/utils/cookie'

import { GETNotificationSchema, NotificationFilter } from './schema'

const LIMIT = 20
const maxAge = 5

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

export async function GET(request: Request) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const searchParams = new URL(request.url).searchParams

  const validation = GETNotificationSchema.safeParse({
    nextId: searchParams.get('nextId'),
    filters: searchParams.getAll('filter'),
  })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { nextId, filters } = validation.data

  try {
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
      .limit(LIMIT + 1)

    const hasNextPage = results.length > LIMIT
    const notifications = results.slice(0, LIMIT)

    const cacheControl = createCacheControl({
      private: true,
      maxAge,
    })

    return Response.json(
      {
        notifications,
        hasNextPage,
      } satisfies GETNotificationResponse,
      { headers: { 'Cache-Control': cacheControl } },
    )
  } catch (error) {
    return handleRouteError(error, request)
  }
}
