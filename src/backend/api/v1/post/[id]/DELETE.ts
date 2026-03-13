import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import { postTable } from '@/database/supabase/post'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DELETEV1PostIdResponse = void

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('param', paramsSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: postId } = c.req.valid('param')

  try {
    const deleted = await db
      .update(postTable)
      .set({
        deletedAt: new Date(),
        content: null,
      })
      .where(and(eq(postTable.userId, userId), eq(postTable.id, postId)))
      .returning({ id: postTable.id })

    if (deleted.length === 0) {
      return problemResponse(c, { status: 404, detail: '글을 찾을 수 없어요' })
    }

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '글을 삭제하지 못했어요' })
  }
})

export default route
