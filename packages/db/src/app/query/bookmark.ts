import { db } from '@litomi/db/app'
import { bookmarkTable } from '@litomi/db/app/activity'
import {
  getLibraryItemCursorCondition,
  getLibraryItemOrderByClauses,
  type LibraryItemCursor,
} from '@litomi/db/sql/library-item-sort'
import { DEFAULT_LIBRARY_ITEM_SORT, type LibraryItemSort } from '@litomi/domain/library/sort'
import { and, eq } from 'drizzle-orm'

export type BookmarkRow = {
  mangaId: number
  createdAt: Date
}

export interface SelectBookmarkOptions {
  limit?: number
  sort?: LibraryItemSort
  cursor?: LibraryItemCursor
}

export async function selectBookmark(userId: number, options: SelectBookmarkOptions = {}) {
  const { limit, sort = DEFAULT_LIBRARY_ITEM_SORT, cursor } = options

  const query = db
    .select({
      mangaId: bookmarkTable.mangaId,
      createdAt: bookmarkTable.createdAt,
    })
    .from(bookmarkTable)
    .where(buildBookmarkWhereClause(userId, sort, cursor))
    .orderBy(...getLibraryItemOrderByClauses(sort, bookmarkTable))

  if (limit) {
    return query.limit(limit)
  }

  return query
}

export async function selectBookmarkId(userId: number, options: SelectBookmarkOptions = {}) {
  const { limit, sort = DEFAULT_LIBRARY_ITEM_SORT, cursor } = options

  const query = db
    .select({
      mangaId: bookmarkTable.mangaId,
    })
    .from(bookmarkTable)
    .where(buildBookmarkWhereClause(userId, sort, cursor))

  if (limit) {
    return query.limit(limit)
  }

  return query
}

function buildBookmarkWhereClause(userId: number, sort: LibraryItemSort, cursor?: LibraryItemCursor) {
  const conditions = [eq(bookmarkTable.userId, userId)]

  if (cursor) {
    conditions.push(getLibraryItemCursorCondition(sort, cursor, bookmarkTable))
  }

  return and(...conditions)
}
