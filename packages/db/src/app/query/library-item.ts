import { db } from '@litomi/db/app'
import { libraryItemTable } from '@litomi/db/app/library'
import {
  getLibraryItemCursorCondition,
  getLibraryItemOrderByClauses,
  type LibraryItemCursor,
} from '@litomi/db/sql/library-item-sort'
import { DEFAULT_LIBRARY_ITEM_SORT, type LibraryItemSort } from '@litomi/domain/library/sort'
import { and, eq } from 'drizzle-orm'

export type LibraryItemRow = {
  mangaId: number
  createdAt: Date
}

export interface SelectLibraryItemOptions {
  limit?: number
  sort?: LibraryItemSort
  cursor?: LibraryItemCursor
}

export async function selectLibraryItem(libraryId: number, options: SelectLibraryItemOptions = {}) {
  const { limit, sort = DEFAULT_LIBRARY_ITEM_SORT, cursor } = options
  const conditions = [eq(libraryItemTable.libraryId, libraryId)]

  if (cursor) {
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
