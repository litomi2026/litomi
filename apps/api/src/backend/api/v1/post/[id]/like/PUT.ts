import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { isPostgresError } from '@/database/error'
import { db } from '@/database/supabase/drizzle'
import { postLikeTable } from '@/database/supabase/post'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type PUTV1PostIdLikeResponse = {
  liked: true
}

const route = new Hono<Env>()

route.put('/', requireAuth, zProblemValidator('param', paramsSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: postId } = c.req.valid('param')

  try {
    const inserted = await db
      .insert(postLikeTable)
      .values({ userId, postId })
      .onConflictDoNothing()
      .returning({ postId: postLikeTable.postId })

    return c.json<PUTV1PostIdLikeResponse>({ liked: true }, inserted.length > 0 ? 201 : 200)
  } catch (error) {
    if (isPostgresError(error) && error.cause.code === '23503') {
      return problemResponse(c, { status: 404, detail: '글을 찾을 수 없어요' })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '좋아요를 처리하지 못했어요' })
  }
})

export default route
