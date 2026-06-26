import { LibraryItemSort } from '@litomi/domain/library/sort'
import { and, asc, desc, eq, gt, lt, or, type SQL } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

export type LibraryItemCursor = {
  mangaId: number
  timestamp: number
}

export type LibraryItemRow = {
  mangaId: number
  createdAt: Date
}

type LibraryItemColumns = {
  createdAt: AnyPgColumn
  mangaId: AnyPgColumn
}

export function getLibraryItemCursorCondition(
  sort: LibraryItemSort,
  cursor: LibraryItemCursor,
  columns: LibraryItemColumns,
) {
  const cursorTime = new Date(cursor.timestamp)

  switch (sort) {
    case LibraryItemSort.CREATED_ASC:
      return or(
        gt(columns.createdAt, cursorTime),
        and(eq(columns.createdAt, cursorTime), gt(columns.mangaId, cursor.mangaId)),
      )!
    case LibraryItemSort.MANGA_ID_ASC:
      return gt(columns.mangaId, cursor.mangaId)
    case LibraryItemSort.MANGA_ID_DESC:
      return lt(columns.mangaId, cursor.mangaId)
    case LibraryItemSort.CREATED_DESC:
      return or(
        lt(columns.createdAt, cursorTime),
        and(eq(columns.createdAt, cursorTime), lt(columns.mangaId, cursor.mangaId)),
      )!
  }
}

export function getLibraryItemOrderByClauses(sort: LibraryItemSort, columns: LibraryItemColumns): SQL[] {
  switch (sort) {
    case LibraryItemSort.CREATED_ASC:
      return [asc(columns.createdAt), asc(columns.mangaId)]
    case LibraryItemSort.MANGA_ID_ASC:
      return [asc(columns.mangaId)]
    case LibraryItemSort.MANGA_ID_DESC:
      return [desc(columns.mangaId)]
    case LibraryItemSort.CREATED_DESC:
      return [desc(columns.createdAt), desc(columns.mangaId)]
  }
}

export function getNextLibraryItemCursor(row: LibraryItemRow) {
  return `${row.createdAt.getTime()}-${row.mangaId}`
}
