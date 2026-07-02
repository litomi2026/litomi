import { idParamSchema, type PUTV1PostIdLikeResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { postLikeTable } from '@litomi/db/app/post'
import { isPostgresError } from '@litomi/db/error'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.put('/', requireAuth, zProblemValidator('param', idParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: postId } = c.req.valid('param')

  try {
    const inserted = await db
      .insert(postLikeTable)
      .values({ userId, postId })
      .onConflictDoNothing()
      .returning({ postId: postLikeTable.postId })

    return c.json({ liked: true } satisfies PUTV1PostIdLikeResponse, inserted.length > 0 ? 201 : 200)
  } catch (error) {
    if (isPostgresError(error) && error.cause.code === '23503') {
      return problemResponse(c, { status: 404, detail: '글을 찾을 수 없어요' })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '좋아요를 처리하지 못했어요' })
  }
})

export default route
