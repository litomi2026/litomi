import { and, desc, or, sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { bookmarkTable } from '@/database/schema'

export type BookmarkRow = {
  mangaId: number
  source: number
  createdAt: Date
}

type Params = {
  userId: number | string
  limit?: number
  cursorId?: string
  cursorTime?: string
}

export default async function selectBookmarks({ userId, limit, cursorId, cursorTime }: Params): Promise<BookmarkRow[]> {
  const conditions = [sql`${bookmarkTable.userId} = ${userId}`]

  if (cursorId && cursorTime) {
    conditions.push(
      or(
        sql`${bookmarkTable.createdAt} < ${cursorTime}`,
        and(sql`${bookmarkTable.createdAt} = ${cursorTime}`, sql`${bookmarkTable.mangaId} < ${cursorId}`),
      )!,
    )
  } else if (cursorTime) {
    conditions.push(sql`${bookmarkTable.createdAt} < ${cursorTime}`)
  }

  const query = db
    .select({
      mangaId: bookmarkTable.mangaId,
      source: bookmarkTable.source,
      createdAt: bookmarkTable.createdAt,
    })
    .from(bookmarkTable)
    .where(and(...conditions))
    .orderBy(desc(bookmarkTable.createdAt), desc(bookmarkTable.mangaId))

  if (limit) {
    query.limit(limit)
  }

  return query
}
