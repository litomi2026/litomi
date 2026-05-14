import type { SQL } from 'drizzle-orm'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@/backend/api/v1/library/item-sort'
import {
  getCollectionItemCursorCondition,
  getCollectionItemOrderByClauses,
} from '@/backend/api/v1/library/item-sort.server'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable } from '@/database/supabase/library'

export type LibraryItemRow = {
  mangaId: number
  createdAt: Date
}

const baseParamsSchema = z.strictObject({
  libraryId: z.number().int().positive(),
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

type Params = z.input<typeof paramsSchema>

export async function selectLibraryItem(params: Params) {
  const validatedParams = paramsSchema.parse(params)
  const { limit, sort } = validatedParams
  const conditions: (SQL | undefined)[] = [eq(libraryItemTable.libraryId, validatedParams.libraryId)]

  if ('cursorMangaId' in validatedParams) {
    const cursor = {
      mangaId: validatedParams.cursorMangaId,
      timestamp: validatedParams.cursorTime.getTime(),
    }

    conditions.push(getCollectionItemCursorCondition(sort, cursor, libraryItemTable))
  }

  const query = db
    .select({
      mangaId: libraryItemTable.mangaId,
      createdAt: libraryItemTable.createdAt,
    })
    .from(libraryItemTable)
    .where(and(...conditions))
    .orderBy(...getCollectionItemOrderByClauses(sort, libraryItemTable))

  if (limit) {
    return query.limit(limit)
  }

  return query
}
