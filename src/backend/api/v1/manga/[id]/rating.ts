import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import { userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type GETV1MangaIdRatingResponse = {
  rating: number
  updatedAt: Date
} | null

const mangaRoutes = new Hono<Env>()

mangaRoutes.get('/:id/history', zProblemValidator('param', paramSchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  try {
    const { id: mangaId } = c.req.valid('param')

    const [rating] = await db
      .select({
        rating: userRatingTable.rating,
        updatedAt: userRatingTable.updatedAt,
      })
      .from(userRatingTable)
      .where(and(eq(userRatingTable.userId, userId), eq(userRatingTable.mangaId, mangaId)))

    const cacheControl = createCacheControl({
      private: true,
      maxAge: 3,
    })

    if (!rating) {
      return problemResponse(c, { status: 404, detail: '평점이 없어요' })
    }

    return c.json<GETV1MangaIdRatingResponse>(rating, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '평점을 불러오지 못했어요' })
  }
})

export default mangaRoutes
