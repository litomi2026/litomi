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

const deleteBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(MAX_NOTIFICATION_COUNT),
})

export type DELETEV1NotificationBody = z.infer<typeof deleteBodySchema>
export type DELETEV1NotificationResponse = { ids: number[] }

const route = new Hono<Env>()

route.delete('/', zProblemValidator('json', deleteBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { ids } = c.req.valid('json')

  try {
    const deleted = await db
      .delete(notificationTable)
      .where(and(eq(notificationTable.userId, userId), inArray(notificationTable.id, ids)))
      .returning({ id: notificationTable.id })

    return c.json<DELETEV1NotificationResponse>({ ids: deleted.map((item) => item.id) })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '알림 삭제 중 오류가 발생했어요' })
  }
})

export default route
