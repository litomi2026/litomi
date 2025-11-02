import { and, desc, eq, lt, or } from 'drizzle-orm'
import { z } from 'zod'

import { READING_HISTORY_PER_PAGE } from '@/constants/policy'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { readingHistoryTable } from '@/database/supabase/schema'
import { validateUserIdFromCookie } from '@/utils/cookie'

const searchParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(READING_HISTORY_PER_PAGE).default(READING_HISTORY_PER_PAGE),
})

export type GETReadingHistoryResponse = {
  items: ReadingHistoryItem[]
  nextCursor: { updatedAt: number; mangaId: number } | null
}

export type ReadingHistoryItem = {
  mangaId: number
  lastPage: number
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

  const { cursor, limit } = validation.data

  try {
    let query = db
      .select({
        mangaId: readingHistoryTable.mangaId,
        lastPage: readingHistoryTable.lastPage,
        updatedAt: readingHistoryTable.updatedAt,
      })
      .from(readingHistoryTable)
      .where(eq(readingHistoryTable.userId, userId))
      .orderBy(desc(readingHistoryTable.updatedAt), desc(readingHistoryTable.mangaId))
      .limit(limit + 1)
      .$dynamic()

    if (cursor) {
      const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString())
      query = query.where(
        or(
          lt(readingHistoryTable.updatedAt, new Date(decodedCursor.updatedAt)),
          and(
            eq(readingHistoryTable.updatedAt, new Date(decodedCursor.updatedAt)),
            lt(readingHistoryTable.mangaId, decodedCursor.mangaId),
          ),
        ),
      )
    }

    const rows = await query
    const hasNext = rows.length > limit

    if (hasNext) {
      rows.pop()
    }

    const items: ReadingHistoryItem[] = rows.map((row) => ({
      mangaId: row.mangaId,
      lastPage: row.lastPage,
      updatedAt: row.updatedAt.getTime(),
    }))

    const result: GETReadingHistoryResponse = {
      items,
      nextCursor: hasNext ? items[items.length - 1] : null,
    }

    const cacheControl = createCacheControl({
      private: true,
      maxAge: 3,
    })

    return Response.json(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
