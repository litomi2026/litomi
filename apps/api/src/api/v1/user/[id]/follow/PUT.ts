import { db } from '@litomi/db/database/app/drizzle'
import 'server-only'
import { userFollowTable } from '@litomi/db/database/app/user'
import { isPostgresError } from '@litomi/db/database/error'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type PUTV1UserIdFollowResponse = {
  following: true
}

const route = new Hono<Env>()

route.put('/', requireAuth, zProblemValidator('param', paramsSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: targetUserId } = c.req.valid('param')

  if (userId === targetUserId) {
    return problemResponse(c, { status: 400, detail: '자기 자신은 팔로우할 수 없어요' })
  }

  try {
    const inserted = await db
      .insert(userFollowTable)
      .values({
        followerId: userId,
        followeeId: targetUserId,
      })
      .onConflictDoNothing()
      .returning({ followeeId: userFollowTable.followeeId })

    return c.json<PUTV1UserIdFollowResponse>({ following: true }, inserted.length > 0 ? 201 : 200)
  } catch (error) {
    if (isPostgresError(error)) {
      if (error.cause.code === '23503') {
        return problemResponse(c, { status: 404, detail: '사용자를 찾을 수 없어요' })
      }

      if (error.cause.code === '23514') {
        return problemResponse(c, { status: 400, detail: '자기 자신은 팔로우할 수 없어요' })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '팔로우를 처리하지 못했어요' })
  }
})

export default route
