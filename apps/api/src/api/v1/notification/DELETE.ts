import { type DELETEV1NotificationResponse, deleteV1NotificationBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { notificationTable } from '@litomi/db/app/notification'
import { anyOf } from '@litomi/db/sql'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', deleteV1NotificationBodySchema))

route.delete('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { ids } = c.req.valid('json')

  try {
    const deleted = await db
      .delete(notificationTable)
      .where(and(eq(notificationTable.userId, userId), anyOf(notificationTable.id, ids)))
      .returning({ id: notificationTable.id })

    return c.json({ ids: deleted.map((item) => item.id) } satisfies DELETEV1NotificationResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
