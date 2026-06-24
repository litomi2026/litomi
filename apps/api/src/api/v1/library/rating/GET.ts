import { type GETV1RatingsResponse, getV1RatingsQuerySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userRatingTable } from '@litomi/db/app/activity'
import { decodeRatingCursor } from '@litomi/db/cursor'
import { buildRatingWhereClause, getNextRatingCursor, getRatingOrderByClauses } from '@litomi/db/sql/rating-sort'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { getCatalogMangaMap } from '@/utils/catalog-manga'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.get('/', requireAuth, zProblemValidator('query', getV1RatingsQuerySchema), async (c) => {
  const userId = c.get('userId')!
  const { cursor, limit, locale, sort } = c.req.valid('query')
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
    .where(buildRatingWhereClause(userId, sort, decodedCursor))
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
      return c.json<GETV1RatingsResponse>(
        { items: [], nextCursor: null },
        { headers: { 'Cache-Control': cacheControl } },
      )
    }

    const hasNextPage = rows.length > limit
    const items = hasNextPage ? rows.slice(0, limit) : rows
    const lastItem = items[items.length - 1]
    const nextCursor = hasNextPage && lastItem ? getNextRatingCursor(sort, lastItem) : null
    const mangaIds = items.map(({ mangaId }) => mangaId)
    const catalogMangaMap = await getCatalogMangaMap(mangaIds, locale)

    return c.json<GETV1RatingsResponse>(
      {
        items: items.map((row) => ({
          mangaId: row.mangaId,
          manga: catalogMangaMap.get(row.mangaId),
          rating: row.rating,
          createdAt: row.createdAt.getTime(),
          updatedAt: row.updatedAt.getTime(),
        })),
        nextCursor,
      },
      { headers: { 'Cache-Control': cacheControl } },
    )
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '평점 목록을 불러오지 못했어요' })
  }
})

export default route
