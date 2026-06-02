import type { SQL } from 'drizzle-orm'

import { db } from '@litomi/db/app'
import { bookmarkTable } from '@litomi/db/app/activity'
import { getLibraryItemCursorCondition, getLibraryItemOrderByClauses } from '@litomi/db/sql/library-item-sort'
import { DEFAULT_LIBRARY_ITEM_SORT, LibraryItemSort } from '@litomi/domain/library/sort'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export type BookmarkRow = {
  mangaId: number
  createdAt: Date
}

const baseParamsSchema = z.strictObject({
  userId: z.number().int().positive(),
  limit: z.number().int().positive().optional(),
  sort: z.enum(LibraryItemSort).default(DEFAULT_LIBRARY_ITEM_SORT),
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

export async function selectBookmark(params: Params) {
  const validatedParams = paramsSchema.parse(params)
  const { limit, sort } = validatedParams
  const whereClause = buildBookmarkWhereClause(validatedParams)

  const query = db
    .select(bookmarkSelection.default)
    .from(bookmarkTable)
    .where(whereClause)
    .orderBy(...getLibraryItemOrderByClauses(sort, bookmarkTable))

  if (limit) {
    return query.limit(limit)
  }

  return query
}

export async function selectBookmarkId(params: Params) {
  const validatedParams = paramsSchema.parse(params)
  const { limit } = validatedParams
  const whereClause = buildBookmarkWhereClause(validatedParams)
  const query = db.select(bookmarkSelection.ids).from(bookmarkTable).where(whereClause)

  if (limit) {
    return query.limit(limit)
  }

  return query
}

function buildBookmarkWhereClause(params: Params) {
  const { userId } = params
  const conditions: (SQL | undefined)[] = [eq(bookmarkTable.userId, userId)]

  if ('cursorMangaId' in params) {
    const cursor = {
      mangaId: params.cursorMangaId,
      timestamp: params.cursorTime.getTime(),
    }

    const sort = params.sort ?? DEFAULT_LIBRARY_ITEM_SORT

    conditions.push(getLibraryItemCursorCondition(sort, cursor, bookmarkTable))
  }

  return and(...conditions)
}
