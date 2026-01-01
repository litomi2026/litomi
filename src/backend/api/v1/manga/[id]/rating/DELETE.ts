import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

const route = new Hono<Env>()

route.delete('/:id/rating', zProblemValidator('param', paramSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  const { id: mangaId } = c.req.valid('param')

  try {
    const deleted = await db
      .delete(userRatingTable)
      .where(and(eq(userRatingTable.userId, userId), eq(userRatingTable.mangaId, mangaId)))
      .returning({ mangaId: userRatingTable.mangaId })

    if (deleted.length === 0) {
      return problemResponse(c, { status: 404, detail: '평점이 없어요' })
    }

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '평가 삭제에 실패했어요' })
  }
})

export default route
