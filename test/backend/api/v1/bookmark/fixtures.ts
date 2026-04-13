import { createAccessTokenCookies } from '@test/backend/setup/auth'
import { seedUser } from '@test/backend/setup/db'
import { asc, eq } from 'drizzle-orm'

import { bookmarkTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

export async function createBookmarkAuthContext() {
  const user = await seedUser()
  const auth = await createAccessTokenCookies({ userId: user.id })

  return { auth, user }
}

export async function listBookmarksForUser(userId: number) {
  return await db
    .select()
    .from(bookmarkTable)
    .where(eq(bookmarkTable.userId, userId))
    .orderBy(asc(bookmarkTable.mangaId))
}
