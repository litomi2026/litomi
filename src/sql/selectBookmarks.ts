import { and, desc, eq, lt, or, SQL } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { bookmarkTable } from '@/database/supabase/schema'

export type BookmarkRow = {
  mangaId: number
  createdAt: Date
}

type Params = {
  userId: number
  limit?: number
  cursorId?: number
  cursorTime?: Date
}

export default async function selectBookmarks({ userId, limit, cursorId, cursorTime }: Params): Promise<BookmarkRow[]> {
  const conditions: (SQL | undefined)[] = [eq(bookmarkTable.userId, userId)]

  if (cursorId && cursorTime) {
    conditions.push(
      or(
        lt(bookmarkTable.createdAt, cursorTime),
        and(eq(bookmarkTable.createdAt, cursorTime), lt(bookmarkTable.mangaId, cursorId)),
      ),
    )
  } else if (cursorTime) {
    conditions.push(lt(bookmarkTable.createdAt, cursorTime))
  }

  const query = db
    .select({
      mangaId: bookmarkTable.mangaId,
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
