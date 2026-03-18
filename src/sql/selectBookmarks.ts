import type { SQL } from 'drizzle-orm'

import { and, desc, eq, lt, or } from 'drizzle-orm'
import { z } from 'zod'

import { bookmarkTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

export type BookmarkRow = {
  mangaId: number
  createdAt: Date
}

const baseParamsSchema = z.strictObject({
  userId: z.number().int().positive(),
  limit: z.number().int().positive().optional(),
})

const paramsSchema = z.union([
  baseParamsSchema.extend({
    cursorMangaId: z.number().int().positive(),
    cursorTime: z.date(),
  }),
  baseParamsSchema,
])

const bookmarkSelection = {
  default: {
    mangaId: bookmarkTable.mangaId,
    createdAt: bookmarkTable.createdAt,
  },
  ids: {
    mangaId: bookmarkTable.mangaId,
  },
} as const

type Params = z.input<typeof paramsSchema>

export async function selectBookmarkIds(params: Params) {
  const validatedParams = paramsSchema.parse(params)
  const { limit } = validatedParams
  const whereClause = buildBookmarkWhereClause(validatedParams)
  const query = db.select(bookmarkSelection.ids).from(bookmarkTable).where(whereClause)

  if (limit) {
    return query.limit(limit)
  }

  return query
}

export async function selectBookmarks(params: Params) {
  const validatedParams = paramsSchema.parse(params)
  const { limit } = validatedParams
  const whereClause = buildBookmarkWhereClause(validatedParams)

  const query = db
    .select(bookmarkSelection.default)
    .from(bookmarkTable)
    .where(whereClause)
    .orderBy(desc(bookmarkTable.createdAt), desc(bookmarkTable.mangaId))

  if (limit) {
    return query.limit(limit)
  }

  return query
}

function buildBookmarkWhereClause(params: Params) {
  const { userId } = params
  const conditions: (SQL | undefined)[] = [eq(bookmarkTable.userId, userId)]

  if ('cursorMangaId' in params) {
    const { cursorMangaId, cursorTime } = params

    conditions.push(
      or(
        lt(bookmarkTable.createdAt, cursorTime),
        and(eq(bookmarkTable.createdAt, cursorTime), lt(bookmarkTable.mangaId, cursorMangaId)),
      ),
    )
  }

  return and(...conditions)
}
