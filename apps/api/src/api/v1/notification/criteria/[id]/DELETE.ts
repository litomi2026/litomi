import { type DELETEV1NotificationCriteriaIdResponse, idParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { notificationCriteriaTable } from '@litomi/db/app/notification'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', zProblemValidator('param', idParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: criteriaId } = c.req.valid('param')

  try {
    const [deleted] = await db
      .delete(notificationCriteriaTable)
      .where(and(eq(notificationCriteriaTable.id, criteriaId), eq(notificationCriteriaTable.userId, userId)))
      .returning({ id: notificationCriteriaTable.id })

    if (!deleted) {
      return problemResponse(c, { status: 404, detail: '알림 기준을 찾을 수 없어요' })
    }

    return c.json(deleted satisfies DELETEV1NotificationCriteriaIdResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
