import { db } from '@litomi/db/database/supabase/drizzle'
import { postLikeTable } from '@litomi/db/database/supabase/post'
import 'server-only'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DELETEV1PostIdLikeResponse = void

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('param', paramsSchema), async (c) => {
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
