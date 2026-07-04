import type { PATCHV1NotificationReadAllResponse, PATCHV1NotificationReadResponse } from '@litomi/contracts'

import { patchV1NotificationReadBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { notificationTable } from '@litomi/db/app/notification'
import { and, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.patch('/read', zProblemValidator('json', patchV1NotificationReadBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { ids } = c.req.valid('json')

  try {
    const updated = await db
      .update(notificationTable)
      .set({ read: true })
      .where(and(eq(notificationTable.userId, userId), inArray(notificationTable.id, ids)))
      .returning({ id: notificationTable.id })

    return c.json({ ids: updated.map((item) => item.id) } satisfies PATCHV1NotificationReadResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
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

    return c.json({ updatedCount: updated.length } satisfies PATCHV1NotificationReadAllResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
