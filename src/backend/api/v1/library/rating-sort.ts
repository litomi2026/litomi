import 'server-only'
import { and, asc, desc, eq, gt, lt, or, SQL } from 'drizzle-orm'

import { encodeRatingCursor } from '@/common/cursor'
import { userRatingTable } from '@/database/supabase/activity'

import { RatingSort } from './enum'

export type RatingCursor = {
  rating: number
  timestamp: number
  mangaId: number
}

export type RatingRow = {
  mangaId: number
  rating: number
  createdAt: Date
  updatedAt: Date
}

export function buildRatingWhereClause(userId: number, sort: RatingSort, cursor?: RatingCursor | null) {
  const conditions: SQL[] = [eq(userRatingTable.userId, userId)]

  if (cursor) {
    conditions.push(getRatingCursorCondition(sort, cursor))
  }

  return and(...conditions)!
}

export function getNextRatingCursor(sort: RatingSort, row: RatingRow) {
  const timestamp = getRatingCursorTimestamp(sort, row)
  return encodeRatingCursor(row.rating, timestamp, row.mangaId)
}

export function getRatingOrderByClauses(sort: RatingSort): SQL[] {
  switch (sort) {
    case RatingSort.CREATED_DESC:
      return [desc(userRatingTable.createdAt), desc(userRatingTable.mangaId)]
    case RatingSort.MANGA_ID_ASC:
      return [asc(userRatingTable.mangaId)]
    case RatingSort.MANGA_ID_DESC:
      return [desc(userRatingTable.mangaId)]
    case RatingSort.RATING_ASC:
      return [asc(userRatingTable.rating), desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId)]
    case RatingSort.RATING_DESC:
      return [desc(userRatingTable.rating), desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId)]
    case RatingSort.UPDATED_DESC:
    default:
      return [desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId)]
  }
}

function getRatingCursorCondition(sort: RatingSort, cursor: RatingCursor) {
  const cursorTime = new Date(cursor.timestamp)

  switch (sort) {
    case RatingSort.CREATED_DESC:
      return or(
        lt(userRatingTable.createdAt, cursorTime),
        and(eq(userRatingTable.createdAt, cursorTime), lt(userRatingTable.mangaId, cursor.mangaId)),
      )!
    case RatingSort.MANGA_ID_ASC:
      return gt(userRatingTable.mangaId, cursor.mangaId)
    case RatingSort.MANGA_ID_DESC:
      return lt(userRatingTable.mangaId, cursor.mangaId)
    case RatingSort.RATING_ASC:
      return or(
        gt(userRatingTable.rating, cursor.rating),
        and(eq(userRatingTable.rating, cursor.rating), lt(userRatingTable.updatedAt, cursorTime)),
        and(
          eq(userRatingTable.rating, cursor.rating),
          eq(userRatingTable.updatedAt, cursorTime),
          lt(userRatingTable.mangaId, cursor.mangaId),
        ),
      )!
    case RatingSort.RATING_DESC:
      return or(
        lt(userRatingTable.rating, cursor.rating),
        and(eq(userRatingTable.rating, cursor.rating), lt(userRatingTable.updatedAt, cursorTime)),
        and(
          eq(userRatingTable.rating, cursor.rating),
          eq(userRatingTable.updatedAt, cursorTime),
          lt(userRatingTable.mangaId, cursor.mangaId),
        ),
      )!
    case RatingSort.UPDATED_DESC:
    default:
      return or(
        lt(userRatingTable.updatedAt, cursorTime),
        and(eq(userRatingTable.updatedAt, cursorTime), lt(userRatingTable.mangaId, cursor.mangaId)),
      )!
  }
}

function getRatingCursorTimestamp(sort: RatingSort, row: RatingRow) {
  switch (sort) {
    case RatingSort.CREATED_DESC:
      return row.createdAt.getTime()
    case RatingSort.MANGA_ID_ASC:
    case RatingSort.MANGA_ID_DESC:
    case RatingSort.RATING_ASC:
    case RatingSort.RATING_DESC:
    case RatingSort.UPDATED_DESC:
    default:
      return row.updatedAt.getTime()
  }
}
