import { and, desc, eq, lt, or, SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { decodeReadingHistoryCursor, encodeReadingHistoryCursor } from '@/common/cursor'
import { READING_HISTORY_PER_PAGE } from '@/constants/policy'
import { readingHistoryTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

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

libraryHistoryRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  const { cursor, limit } = c.req.valid('query')
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
      : createCacheControl({
          private: true,
          maxAge: 3,
        })

    if (rows.length === 0) {
      const result = { items: [], nextCursor: null }
      return c.json<GETV1ReadingHistoryResponse>(result, { headers: { 'Cache-Control': cacheControl } })
    }

    const hasNextPage = rows.length > limit
    const items = hasNextPage ? rows.slice(0, limit) : rows
    const lastItem = items[items.length - 1]

    const result = {
      items: items.map((row) => ({
        mangaId: row.mangaId,
        lastPage: row.lastPage,
        updatedAt: row.updatedAt.getTime(),
      })),
      nextCursor: hasNextPage ? encodeReadingHistoryCursor(lastItem.updatedAt.getTime(), lastItem.mangaId) : null,
    }

    return c.json<GETV1ReadingHistoryResponse>(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '감상 기록을 불러오지 못했어요' })
  }
})

export default libraryHistoryRoutes
