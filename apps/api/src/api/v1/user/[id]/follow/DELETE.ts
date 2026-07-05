import { idParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userFollowTable } from '@litomi/db/app/user'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', idParamSchema))

route.delete('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { id: targetUserId } = c.req.valid('param')

  try {
    await db
      .delete(userFollowTable)
      .where(and(eq(userFollowTable.followerId, userId), eq(userFollowTable.followeeId, targetUserId)))

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
