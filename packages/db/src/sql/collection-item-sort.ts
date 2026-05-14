import 'server-only'
import { and, asc, desc, eq, gt, lt, or, SQL } from 'drizzle-orm'
import { AnyPgColumn } from 'drizzle-orm/pg-core'

import { CollectionItemSort } from './item-sort'

export type CollectionItemCursor = {
  mangaId: number
  timestamp: number
}

export type CollectionItemRow = {
  mangaId: number
  createdAt: Date
}

type CollectionItemColumns = {
  createdAt: AnyPgColumn
  mangaId: AnyPgColumn
}

export function getCollectionItemCursorCondition(
  sort: CollectionItemSort,
  cursor: CollectionItemCursor,
  columns: CollectionItemColumns,
) {
  const cursorTime = new Date(cursor.timestamp)

  switch (sort) {
    case CollectionItemSort.CREATED_ASC:
      return or(
        gt(columns.createdAt, cursorTime),
        and(eq(columns.createdAt, cursorTime), gt(columns.mangaId, cursor.mangaId)),
      )!
    case CollectionItemSort.MANGA_ID_ASC:
      return gt(columns.mangaId, cursor.mangaId)
    case CollectionItemSort.MANGA_ID_DESC:
      return lt(columns.mangaId, cursor.mangaId)
    case CollectionItemSort.CREATED_DESC:
    default:
      return or(
        lt(columns.createdAt, cursorTime),
        and(eq(columns.createdAt, cursorTime), lt(columns.mangaId, cursor.mangaId)),
      )!
  }
}

export function getCollectionItemOrderByClauses(sort: CollectionItemSort, columns: CollectionItemColumns): SQL[] {
  switch (sort) {
    case CollectionItemSort.CREATED_ASC:
      return [asc(columns.createdAt), asc(columns.mangaId)]
    case CollectionItemSort.MANGA_ID_ASC:
      return [asc(columns.mangaId)]
    case CollectionItemSort.MANGA_ID_DESC:
      return [desc(columns.mangaId)]
    case CollectionItemSort.CREATED_DESC:
    default:
      return [desc(columns.createdAt), desc(columns.mangaId)]
  }
}

export function getNextCollectionItemCursor(row: CollectionItemRow) {
  return `${row.createdAt.getTime()}-${row.mangaId}`
}
