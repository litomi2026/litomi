import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type GETV1MangaIdRatingResponse = {
  rating: number
  updatedAt: number
} | null

const route = new Hono<Env>()

route.get('/:id/rating', requireAuth, zProblemValidator('param', paramSchema), async (c) => {
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

    const result: GETV1MangaIdRatingResponse = {
      rating: rating.rating,
      updatedAt: rating.updatedAt.getTime(),
    }

    return c.json<GETV1MangaIdRatingResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '평점을 불러오지 못했어요' })
  }
})

export default route
