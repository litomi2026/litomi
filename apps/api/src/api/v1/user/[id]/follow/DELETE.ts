import { db } from '@litomi/db/database/app/drizzle'
import { userFollowTable } from '@litomi/db/database/app/user'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DELETEV1UserIdFollowResponse = void

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('param', paramsSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: targetUserId } = c.req.valid('param')

  try {
    await db
      .delete(userFollowTable)
      .where(and(eq(userFollowTable.followerId, userId), eq(userFollowTable.followeeId, targetUserId)))

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '언팔로우를 처리하지 못했어요' })
  }
})

export default route
