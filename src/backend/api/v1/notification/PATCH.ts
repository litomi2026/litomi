import { and, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_NOTIFICATION_COUNT } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { notificationTable } from '@/database/supabase/notification'

const markAsReadBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(MAX_NOTIFICATION_COUNT),
})

export type PATCHV1NotificationReadAllResponse = { updatedCount: number }
export type PATCHV1NotificationReadBody = z.infer<typeof markAsReadBodySchema>
export type PATCHV1NotificationReadResponse = { ids: number[] }

const route = new Hono<Env>()

route.patch('/read', zProblemValidator('json', markAsReadBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { ids } = c.req.valid('json')

  try {
    const updated = await db
      .update(notificationTable)
      .set({ read: true })
      .where(and(eq(notificationTable.userId, userId), inArray(notificationTable.id, ids)))
      .returning({ id: notificationTable.id })

    return c.json<PATCHV1NotificationReadResponse>({ ids: updated.map((item) => item.id) })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '알림을 읽는 도중 오류가 발생했어요' })
  }
})

route.patch('/read-all', async (c) => {
  const userId = c.get('userId')!

  try {
    const updated = await db
      .update(notificationTable)
      .set({ read: true })
      .where(and(eq(notificationTable.userId, userId), eq(notificationTable.read, false)))
      .returning({ id: notificationTable.id })

    return c.json<PATCHV1NotificationReadAllResponse>({ updatedCount: updated.length })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '알림을 읽는 도중 오류가 발생했어요' })
  }
})

export default route
