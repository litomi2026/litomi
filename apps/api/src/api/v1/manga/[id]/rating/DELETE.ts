import { mangaIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userRatingTable } from '@litomi/db/app/activity'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/:id/rating', requireAuth, zProblemValidator('param', mangaIdParamSchema), async (c) => {
  const userId = c.get('userId')!

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
    return problemResponse(c, { status: 500 })
  }
})

export default route
