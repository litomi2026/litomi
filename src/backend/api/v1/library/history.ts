import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, lt, or, SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { decodeReadingHistoryCursor, encodeReadingHistoryCursor } from '@/common/cursor'
import { READING_HISTORY_PER_PAGE } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { readingHistoryTable } from '@/database/supabase/schema'
import { sec } from '@/utils/date'

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(READING_HISTORY_PER_PAGE).default(READING_HISTORY_PER_PAGE),
})

export type GETV1ReadingHistoryResponse = {
  items: ReadingHistoryItem[]
  nextCursor: string | null
}

export type ReadingHistoryItem = {
  mangaId: number
  lastPage: number
  updatedAt: number
}

const libraryHistoryRoutes = new Hono<Env>()

libraryHistoryRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  const { cursor, limit } = c.req.valid('query')
  const decodedCursor = cursor ? decodeReadingHistoryCursor(cursor) : null

  if (cursor && !decodedCursor) {
    throw new HTTPException(400)
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

  const rows = await query
  const hasNextPage = rows.length > limit
  const items = hasNextPage ? rows.slice(0, limit) : rows
  const lastItem = items[items.length - 1]

  const result: GETV1ReadingHistoryResponse = {
    items: items.map((row) => ({
      mangaId: row.mangaId,
      lastPage: row.lastPage,
      updatedAt: row.updatedAt.getTime(),
    })),
    nextCursor: hasNextPage ? encodeReadingHistoryCursor(lastItem.updatedAt.getTime(), lastItem.mangaId) : null,
  }

  const cacheControl = decodedCursor
    ? createCacheControl({
        private: true,
        maxAge: sec('1 hour'),
      })
    : createCacheControl({
        private: true,
        maxAge: 3,
      })

  return c.json(result, { headers: { 'Cache-Control': cacheControl } })
})

export default libraryHistoryRoutes
