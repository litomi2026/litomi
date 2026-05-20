import { deleteV1NotificationBodySchema, type DELETEV1NotificationResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { notificationTable } from '@litomi/db/app/notification'
import { and, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', zProblemValidator('json', deleteV1NotificationBodySchema), async (c) => {
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
