import { postIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { postLikeTable } from '@litomi/db/app/post'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('param', postIdParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: postId } = c.req.valid('param')

  try {
    await db.delete(postLikeTable).where(and(eq(postLikeTable.userId, userId), eq(postLikeTable.postId, postId)))

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '좋아요를 처리하지 못했어요' })
  }
})

export default route
