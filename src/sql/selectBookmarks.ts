import { db } from '@/database/drizzle'
import { bookmarkTable } from '@/database/schema'
import { sql } from 'drizzle-orm'

type Params = {
  userId: number | string
}

export default async function selectBookmarks({ userId }: Params) {
  return db
    .select({ mangaId: bookmarkTable.mangaId })
    .from(bookmarkTable)
    .where(sql`${bookmarkTable.userId} = ${userId}`)
    .orderBy(sql`${bookmarkTable.createdAt} DESC`)
}
