import { and, eq, isNull } from 'drizzle-orm'
import 'server-only'

import { authSessionFamilyTable } from '@/database/supabase/auth'
import { db } from '@/database/supabase/drizzle'

export async function revokeAllSessionsByUserId(userId: number, now: Date) {
  await db
    .update(authSessionFamilyTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionFamilyTable.userId, userId), isNull(authSessionFamilyTable.revokedAt)))
}
