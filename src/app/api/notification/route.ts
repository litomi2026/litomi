import { and, desc, eq, inArray, sql } from 'drizzle-orm'

import { handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { notificationTable } from '@/database/schema'
import { getUserIdFromCookie } from '@/utils/session'

import { GETNotificationSchema, NotificationFilter } from './schema'

const LIMIT = 20

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
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const searchParams = new URL(request.url).searchParams

  const validation = GETNotificationSchema.safeParse({
    nextId: searchParams.get('nextId'),
    filter: searchParams.get('filter'),
    types: searchParams.getAll('type'),
  })

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { nextId, filter, types } = validation.data

  try {
    const conditions = [sql`${notificationTable.userId} = ${userId}`]

    if (nextId) {
      conditions.push(sql`${notificationTable.id} < ${nextId}`)
    }

    if (filter === NotificationFilter.UNREAD) {
      conditions.push(eq(notificationTable.read, false))
    } else if (filter === NotificationFilter.READ) {
      conditions.push(eq(notificationTable.read, true))
    }

    if (types && types.length > 0) {
      conditions.push(inArray(notificationTable.type, types))
    }

    const results = await db
      .select()
      .from(notificationTable)
      .where(and(...conditions))
      .orderBy(desc(notificationTable.id))
      .limit(LIMIT + 1)

    const hasNextPage = results.length > LIMIT
    const notifications = results.slice(0, LIMIT)

    return Response.json({
      notifications,
      hasNextPage,
    } satisfies GETNotificationResponse)
  } catch (error) {
    return handleRouteError(error, request)
  }
}
