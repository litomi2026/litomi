import type { SQL } from 'drizzle-orm'

import { db } from '@litomi/db/app'
import { libraryItemTable } from '@litomi/db/app/library'
import { getLibraryItemCursorCondition, getLibraryItemOrderByClauses } from '@litomi/db/sql/library-item-sort'
import { DEFAULT_LIBRARY_ITEM_SORT, LibraryItemSort } from '@litomi/domain/library/sort'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

export type LibraryItemRow = {
  mangaId: number
  createdAt: Date
}

const baseParamsSchema = z.strictObject({
  libraryId: z.number().int().positive(),
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

    conditions.push(getLibraryItemCursorCondition(sort, cursor, libraryItemTable))
  }

  const query = db
    .select({
      mangaId: libraryItemTable.mangaId,
      createdAt: libraryItemTable.createdAt,
    })
    .from(libraryItemTable)
    .where(and(...conditions))
    .orderBy(...getLibraryItemOrderByClauses(sort, libraryItemTable))

  if (limit) {
    return query.limit(limit)
  }

  return query
}
