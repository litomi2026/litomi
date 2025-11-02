import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { MAX_MANGA_ID } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { userRatingTable } from '@/database/supabase/schema'

const paramSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type GETV1MangaIdRatingResponse = {
  rating: number
  updatedAt: Date
} | null

const mangaRoutes = new Hono<Env>()

mangaRoutes.get('/:id/history', zValidator('param', paramSchema), async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

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
    throw new HTTPException(404)
  }

  return c.json<GETV1MangaIdRatingResponse>(rating, { headers: { 'Cache-Control': cacheControl } })
})

export default mangaRoutes
