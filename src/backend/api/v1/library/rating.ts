import { and, desc, eq, gt, lt, or, SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { decodeRatingCursor, encodeRatingCursor } from '@/common/cursor'
import { RATING_PER_PAGE } from '@/constants/policy'
import { userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

import { RatingSort } from './enum'

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

libraryRatingRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  const { cursor, limit, sort } = c.req.valid('query')
  const decodedCursor = cursor ? decodeRatingCursor(cursor) : null

  if (cursor && !decodedCursor) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
  }

  const conditions: (SQL | undefined)[] = [eq(userRatingTable.userId, userId)]

  if (decodedCursor) {
    const { rating, timestamp, mangaId } = decodedCursor

    switch (sort) {
      case RatingSort.CREATED_DESC:
        conditions.push(
          or(
            lt(userRatingTable.createdAt, new Date(timestamp)),
            and(eq(userRatingTable.createdAt, new Date(timestamp)), lt(userRatingTable.mangaId, mangaId)),
          ),
        )
        break
      case RatingSort.RATING_ASC:
        conditions.push(
          or(
            gt(userRatingTable.rating, rating),
            and(eq(userRatingTable.rating, rating), lt(userRatingTable.updatedAt, new Date(timestamp))),
            and(
              eq(userRatingTable.rating, rating),
              eq(userRatingTable.updatedAt, new Date(timestamp)),
              lt(userRatingTable.mangaId, mangaId),
            ),
          ),
        )
        break
      case RatingSort.RATING_DESC:
        conditions.push(
          or(
            lt(userRatingTable.rating, rating),
            and(eq(userRatingTable.rating, rating), lt(userRatingTable.updatedAt, new Date(timestamp))),
            and(
              eq(userRatingTable.rating, rating),
              eq(userRatingTable.updatedAt, new Date(timestamp)),
              lt(userRatingTable.mangaId, mangaId),
            ),
          ),
        )
        break
      case RatingSort.UPDATED_DESC:
        conditions.push(
          or(
            lt(userRatingTable.updatedAt, new Date(timestamp)),
            and(eq(userRatingTable.updatedAt, new Date(timestamp)), lt(userRatingTable.mangaId, mangaId)),
          ),
        )
        break
    }
  }

  let query = db
    .select({
      mangaId: userRatingTable.mangaId,
      rating: userRatingTable.rating,
      createdAt: userRatingTable.createdAt,
      updatedAt: userRatingTable.updatedAt,
    })
    .from(userRatingTable)
    .where(and(...conditions))
    .limit(limit + 1)
    .$dynamic()

  switch (sort) {
    case RatingSort.CREATED_DESC:
      query = query.orderBy(desc(userRatingTable.createdAt), desc(userRatingTable.mangaId))
      break
    case RatingSort.RATING_ASC:
      query = query.orderBy(userRatingTable.rating, desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId))
      break
    case RatingSort.RATING_DESC:
      query = query.orderBy(
        desc(userRatingTable.rating),
        desc(userRatingTable.updatedAt),
        desc(userRatingTable.mangaId),
      )
      break
    case RatingSort.UPDATED_DESC:
      query = query.orderBy(desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId))
      break
  }

  try {
    const rows = await query

    const cacheControl = decodedCursor
      ? createCacheControl({
          private: true,
          maxAge: sec('1 hour'),
        })
      : createCacheControl({
          private: true,
          maxAge: 3,
        })

    if (rows.length === 0) {
      const result = { items: [], nextCursor: null }
      return c.json<GETV1RatingsResponse>(result, { headers: { 'Cache-Control': cacheControl } })
    }

    const hasNextPage = rows.length > limit
    const items = hasNextPage ? rows.slice(0, limit) : rows
    const lastItem = items[items.length - 1]
    let nextCursor: string | null = null

    if (hasNextPage && lastItem) {
      const { rating, createdAt, updatedAt, mangaId } = lastItem
      nextCursor = getNextCursor(sort, rating, createdAt, updatedAt, mangaId)
    }

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

function getNextCursor(sort: RatingSort, rating: number, createdAt: Date, updatedAt: Date, mangaId: number) {
  switch (sort) {
    case RatingSort.CREATED_DESC:
      return encodeRatingCursor(rating, createdAt.getTime(), mangaId)
    case RatingSort.RATING_ASC:
      return encodeRatingCursor(rating, updatedAt.getTime(), mangaId)
    case RatingSort.RATING_DESC:
      return encodeRatingCursor(rating, updatedAt.getTime(), mangaId)
    case RatingSort.UPDATED_DESC:
      return encodeRatingCursor(rating, updatedAt.getTime(), mangaId)
  }
}

export default libraryRatingRoutes
