import { and, desc, eq, lt } from 'drizzle-orm'
import { z } from 'zod/v4'

import { READING_HISTORY_PER_PAGE } from '@/constants/policy'
import { createCacheControl, handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { readingHistoryTable } from '@/database/schema'
import { sec } from '@/utils/date'
import { getUserIdFromCookie } from '@/utils/session'

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
  const userId = await getUserIdFromCookie()

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
      .where(eq(readingHistoryTable.userId, Number(userId)))
      .orderBy(desc(readingHistoryTable.updatedAt), desc(readingHistoryTable.mangaId))
      .limit(limit + 1)
      .$dynamic()

    if (cursor) {
      const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString())
      query = query.where(
        and(
          eq(readingHistoryTable.userId, Number(userId)),
          lt(readingHistoryTable.updatedAt, new Date(decodedCursor.updatedAt)),
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

    const nextCursor = hasNext
      ? {
          updatedAt: items[items.length - 1].updatedAt,
          mangaId: items[items.length - 1].mangaId,
        }
      : null

    const cacheControl = createCacheControl({
      private: true,
      maxAge: sec('1 minute'),
    })

    return Response.json({ items, nextCursor } satisfies GETReadingHistoryResponse, {
      headers: { 'cache-control': cacheControl },
    })
  } catch (error) {
    return handleRouteError(error, request)
  }
}
