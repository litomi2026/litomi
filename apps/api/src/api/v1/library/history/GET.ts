import { type GETV1ReadingHistoryResponse, getV1ReadingHistoryQuerySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { readingHistoryTable } from '@litomi/db/app/activity'
import { decodeReadingHistoryCursor, encodeReadingHistoryCursor } from '@litomi/db/cursor'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { and, desc, eq, lt, or, type SQL } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { getCatalogMangaMap } from '@/utils/catalog-manga'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const libraryHistoryRoutes = new Hono<Env>()

libraryHistoryRoutes.get(
  '/',
  requireAuth,
  requireAdult,
  zProblemValidator('query', getV1ReadingHistoryQuerySchema),
  async (c) => {
    const userId = c.get('userId')!
    const { cursor, limit, locale } = c.req.valid('query')
    const decodedCursor = cursor ? decodeReadingHistoryCursor(cursor) : null

    if (cursor && !decodedCursor) {
      return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
    }

    const conditions: (SQL | undefined)[] = [eq(readingHistoryTable.userId, userId)]

    if (decodedCursor) {
      conditions.push(
        or(
          lt(readingHistoryTable.updatedAt, new Date(decodedCursor.timestamp)),
          and(
            eq(readingHistoryTable.updatedAt, new Date(decodedCursor.timestamp)),
            lt(readingHistoryTable.mangaId, decodedCursor.mangaId),
          ),
        ),
      )
    }

    const query = db
      .select({
        mangaId: readingHistoryTable.mangaId,
        lastPage: readingHistoryTable.lastPage,
        updatedAt: readingHistoryTable.updatedAt,
      })
      .from(readingHistoryTable)
      .where(and(...conditions))
      .orderBy(desc(readingHistoryTable.updatedAt), desc(readingHistoryTable.mangaId))
      .limit(limit + 1)

    try {
      const rows = await query

      const cacheControl = decodedCursor
        ? createCacheControl({
            private: true,
            maxAge: sec('1 hour'),
          })
        : privateCacheControl

      if (rows.length === 0) {
        const result = {
          items: [],
          nextCursor: null,
        } satisfies GETV1ReadingHistoryResponse

        return c.json(result, { headers: { 'Cache-Control': cacheControl } })
      }

      const hasNextPage = rows.length > limit
      const items = hasNextPage ? rows.slice(0, limit) : rows
      const lastItem = items[items.length - 1]
      const mangaIds = items.map(({ mangaId }) => mangaId)
      const catalogMangaMap = await getCatalogMangaMap(mangaIds, locale)

      const result = {
        items: items.map((row) => ({
          mangaId: row.mangaId,
          lastPage: row.lastPage,
          updatedAt: row.updatedAt.getTime(),
          manga: catalogMangaMap.get(row.mangaId),
        })),
        nextCursor: hasNextPage ? encodeReadingHistoryCursor(lastItem.updatedAt.getTime(), lastItem.mangaId) : null,
      } satisfies GETV1ReadingHistoryResponse

      return c.json(result, { headers: { 'Cache-Control': cacheControl } })
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500 })
    }
  },
)

export default libraryHistoryRoutes
