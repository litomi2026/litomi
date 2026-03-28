import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { decodeRatingCursor } from '@/common/cursor'
import { RATING_PER_PAGE } from '@/constants/policy'
import { userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

import { RatingSort } from './enum'
import { buildRatingWhereClause, getNextRatingCursor, getRatingOrderByClauses } from './rating-sort'

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(RATING_PER_PAGE).default(RATING_PER_PAGE),
  sort: z.enum(RatingSort).default(RatingSort.UPDATED_DESC),
})

export type GETV1RatingsResponse = {
  items: RatingItem[]
  nextCursor: string | null
}

export type RatingItem = {
  mangaId: number
  rating: number
  createdAt: number
  updatedAt: number
}

const libraryRatingRoutes = new Hono<Env>()

libraryRatingRoutes.get('/', requireAuth, zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')!

  const { cursor, limit, sort } = c.req.valid('query')
  const decodedCursor = cursor ? decodeRatingCursor(cursor) : null

  if (cursor && !decodedCursor) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
  }

  const query = db
    .select({
      mangaId: userRatingTable.mangaId,
      rating: userRatingTable.rating,
      createdAt: userRatingTable.createdAt,
      updatedAt: userRatingTable.updatedAt,
    })
    .from(userRatingTable)
    .where(buildRatingWhereClause(userId, sort, decodedCursor ?? undefined))
    .limit(limit + 1)
    .orderBy(...getRatingOrderByClauses(sort))

  try {
    const rows = await query

    const cacheControl = decodedCursor
      ? createCacheControl({
          private: true,
          maxAge: sec('1 hour'),
        })
      : privateCacheControl

    if (rows.length === 0) {
      const result = { items: [], nextCursor: null }
      return c.json<GETV1RatingsResponse>(result, { headers: { 'Cache-Control': cacheControl } })
    }

    const hasNextPage = rows.length > limit
    const items = hasNextPage ? rows.slice(0, limit) : rows
    const lastItem = items[items.length - 1]
    const nextCursor = hasNextPage && lastItem ? getNextRatingCursor(sort, lastItem) : null

    const result = {
      items: items.map((row) => ({
        mangaId: row.mangaId,
        rating: row.rating,
        createdAt: row.createdAt.getTime(),
        updatedAt: row.updatedAt.getTime(),
      })),
      nextCursor,
    }

    return c.json<GETV1RatingsResponse>(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '평점 목록을 불러오지 못했어요' })
  }
})

export default libraryRatingRoutes
