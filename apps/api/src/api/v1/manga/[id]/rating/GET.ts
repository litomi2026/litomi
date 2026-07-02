import { type GETV1MangaIdRatingResponse, mangaIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userRatingTable } from '@litomi/db/app/activity'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.get('/:id/rating', requireAuth, zProblemValidator('param', mangaIdParamSchema), async (c) => {
  const userId = c.get('userId')!

  const { id: mangaId } = c.req.valid('param')

  try {
    const [rating] = await db
      .select({
        rating: userRatingTable.rating,
        updatedAt: userRatingTable.updatedAt,
      })
      .from(userRatingTable)
      .where(and(eq(userRatingTable.userId, userId), eq(userRatingTable.mangaId, mangaId)))

    if (!rating) {
      return problemResponse(c, {
        status: 404,
        detail: '평점이 없어요',
        headers: { 'Cache-Control': privateCacheControl },
      })
    }

    const result = {
      rating: rating.rating,
      updatedAt: rating.updatedAt.getTime(),
    } satisfies GETV1MangaIdRatingResponse

    return c.json(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '평점을 불러오지 못했어요' })
  }
})

export default route
