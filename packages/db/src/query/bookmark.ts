import type { SQL } from 'drizzle-orm'

import { bookmarkTable } from '@litomi/db/database/app/activity'
import { db } from '@litomi/db/database/app/drizzle'
import { getCollectionItemCursorCondition, getCollectionItemOrderByClauses } from '@litomi/db/sql/collection-item-sort'
import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@litomi/domain/library/sort'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export type BookmarkRow = {
  mangaId: number
  createdAt: Date
}

const baseParamsSchema = z.strictObject({
  userId: z.number().int().positive(),
  limit: z.number().int().positive().optional(),
  sort: z.enum(CollectionItemSort).default(DEFAULT_COLLECTION_ITEM_SORT),
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
    .orderBy(...getCollectionItemOrderByClauses(sort, bookmarkTable))

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

    const sort = params.sort ?? DEFAULT_COLLECTION_ITEM_SORT

    conditions.push(getCollectionItemCursorCondition(sort, cursor, bookmarkTable))
  }

  return and(...conditions)
}
