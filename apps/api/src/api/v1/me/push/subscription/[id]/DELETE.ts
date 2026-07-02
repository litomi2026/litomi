import { type DELETEV1MePushSubscriptionIdResponse, deleteV1MePushSubscriptionIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { webPushTable } from '@litomi/db/app/notification'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', zProblemValidator('param', deleteV1MePushSubscriptionIdParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id } = c.req.valid('param')

  try {
    const [deleted] = await db
      .delete(webPushTable)
      .where(and(eq(webPushTable.id, id), eq(webPushTable.userId, userId)))
      .returning({ id: webPushTable.id })

    if (!deleted) {
      return problemResponse(c, { status: 404, detail: '브라우저를 찾을 수 없어요' })
    }

    return c.json({
      id: deleted.id,
      message: '푸시 알림을 해제했어요',
    } satisfies DELETEV1MePushSubscriptionIdResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '푸시 알림을 해제하지 못했어요' })
  }
})

export default route
