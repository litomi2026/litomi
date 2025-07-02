import { sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { bookmarkTable } from '@/database/schema'

type Params = {
  userId: number | string
  count?: number
}

export default async function selectBookmarks({ userId, count }: Params) {
  const query = db
    .select({
      mangaId: bookmarkTable.mangaId,
      source: bookmarkTable.source,
    })
    .from(bookmarkTable)
    .where(sql`${bookmarkTable.userId} = ${userId}`)
    .orderBy(sql`${bookmarkTable.createdAt} DESC`)

  if (count) query.limit(count)

  return query
}
