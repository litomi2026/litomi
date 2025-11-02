import { and, desc, eq, gt, lt, or } from 'drizzle-orm'
import { z } from 'zod'

import { decodeRatingCursor, encodeRatingCursor } from '@/common/cursor'
import { RATING_PER_PAGE } from '@/constants/policy'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { userRatingTable } from '@/database/supabase/schema'
import { validateUserIdFromCookie } from '@/utils/cookie'

const searchParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(RATING_PER_PAGE).default(RATING_PER_PAGE),
  sort: z.enum(['rating-desc', 'rating-asc', 'updated-desc', 'created-desc']).default('updated-desc'),
})

export type GETRatingsResponse = {
  items: RatingItem[]
  nextCursor: string | null
}

export type RatingItem = {
  mangaId: number
  rating: number
  createdAt: number
  updatedAt: number
}

export async function GET(request: Request) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const validation = searchParamsSchema.safeParse(Object.fromEntries(searchParams))

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { cursor, limit, sort } = validation.data

  try {
    let query = db
      .select({
        mangaId: userRatingTable.mangaId,
        rating: userRatingTable.rating,
        createdAt: userRatingTable.createdAt,
        updatedAt: userRatingTable.updatedAt,
      })
      .from(userRatingTable)
      .where(eq(userRatingTable.userId, userId))
      .limit(limit + 1)
      .$dynamic()

    switch (sort) {
      case 'created-desc':
        query = query.orderBy(desc(userRatingTable.createdAt), desc(userRatingTable.mangaId))
        break
      case 'rating-asc':
        query = query.orderBy(userRatingTable.rating, desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId))
        break
      case 'rating-desc':
        query = query.orderBy(
          desc(userRatingTable.rating),
          desc(userRatingTable.updatedAt),
          desc(userRatingTable.mangaId),
        )
        break
      case 'updated-desc':
      default:
        query = query.orderBy(desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId))
        break
    }

    if (cursor) {
      const decoded = decodeRatingCursor(cursor)

      if (!decoded) {
        return new Response('Bad Request', { status: 400 })
      }

      const { rating, timestamp, mangaId } = decoded

      switch (sort) {
        case 'created-desc':
          query = query.where(
            or(
              lt(userRatingTable.createdAt, new Date(timestamp)),
              and(eq(userRatingTable.createdAt, new Date(timestamp)), lt(userRatingTable.mangaId, mangaId)),
            ),
          )
          break
        case 'rating-asc':
          query = query.where(
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
        case 'rating-desc':
          query = query.where(
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
        case 'updated-desc':
        default:
          query = query.where(
            or(
              lt(userRatingTable.updatedAt, new Date(timestamp)),
              and(eq(userRatingTable.updatedAt, new Date(timestamp)), lt(userRatingTable.mangaId, mangaId)),
            ),
          )
          break
      }
    }

    const rows = await query
    const hasNext = rows.length > limit

    if (hasNext) {
      rows.pop()
    }

    const items: RatingItem[] = rows.map((row) => ({
      mangaId: row.mangaId,
      rating: row.rating,
      createdAt: row.createdAt.getTime(),
      updatedAt: row.updatedAt.getTime(),
    }))

    let nextCursor: string | null = null

    if (hasNext && items.length > 0) {
      const { rating, createdAt, updatedAt, mangaId } = items[items.length - 1]

      switch (sort) {
        case 'created-desc':
          nextCursor = encodeRatingCursor(rating, createdAt, mangaId)
          break
        case 'rating-asc':
        case 'rating-desc':
          nextCursor = encodeRatingCursor(rating, updatedAt, mangaId)
          break
        case 'updated-desc':
        default:
          nextCursor = encodeRatingCursor(rating, updatedAt, mangaId)
          break
      }
    }

    const result: GETRatingsResponse = {
      items,
      nextCursor,
    }

    const cacheControl = createCacheControl({
      private: true,
      maxAge: 3,
    })

    return Response.json(result, { headers: { 'cache-control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
