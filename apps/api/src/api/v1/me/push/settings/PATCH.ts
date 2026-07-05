import { patchV1MePushSettingsBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { pushSettingsTable } from '@litomi/db/app/notification'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', patchV1MePushSettingsBodySchema))

route.patch('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const settings = c.req.valid('json')
  const updateValues = { ...settings, updatedAt: new Date() }

  try {
    await db
      .insert(pushSettingsTable)
      .values({ userId, ...updateValues })
      .onConflictDoUpdate({
        target: pushSettingsTable.userId,
        set: updateValues,
      })

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
