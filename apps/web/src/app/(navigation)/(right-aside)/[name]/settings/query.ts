import { authSessionFamilyTable } from '@litomi/db/database/app/auth'
import 'server-only'
import { db } from '@litomi/db/database/app/drizzle'
import { and, eq, isNull } from 'drizzle-orm'

export async function revokeAllSessionsByUserId(userId: number, now: Date) {
  await db
    .update(authSessionFamilyTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionFamilyTable.userId, userId), isNull(authSessionFamilyTable.revokedAt)))
}
