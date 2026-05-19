import { authSessionFamilyTable, authSessionTokenTable } from '@litomi/db/database/app/auth'
import { db } from '@litomi/db/database/app/drizzle'
import { and, eq, isNull, ne } from 'drizzle-orm'

type SessionFamilyWriteExecutor = Pick<Parameters<Parameters<typeof db.transaction>[0]>[0], 'update'> | Pick<typeof db, 'update'>

export async function readCurrentSessionFamilyIdByTokenHash(userId: number, tokenHash: string) {
  const [family] = await db
    .select({ id: authSessionFamilyTable.id })
    .from(authSessionTokenTable)
    .innerJoin(authSessionFamilyTable, eq(authSessionFamilyTable.id, authSessionTokenTable.familyId))
    .where(and(eq(authSessionFamilyTable.userId, userId), eq(authSessionTokenTable.tokenHash, tokenHash)))

  return family?.id ?? null
}

export async function revokeAllSessionsByUserId(userId: number, now: Date, tx?: SessionFamilyWriteExecutor) {
  const executor = (tx ?? db) as Pick<typeof db, 'update'>

  await executor
    .update(authSessionFamilyTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionFamilyTable.userId, userId), isNull(authSessionFamilyTable.revokedAt)))
}

export async function revokeOtherSessionFamiliesByUserId(userId: number, excludedFamilyId: string | null, now: Date) {
  const condition = excludedFamilyId
    ? and(
        eq(authSessionFamilyTable.userId, userId),
        ne(authSessionFamilyTable.id, excludedFamilyId),
        isNull(authSessionFamilyTable.revokedAt),
      )
    : and(eq(authSessionFamilyTable.userId, userId), isNull(authSessionFamilyTable.revokedAt))

  await db.update(authSessionFamilyTable).set({ revokedAt: now, lastUsedAt: now }).where(condition)
}

export async function revokeSessionFamilyByIdForUser(userId: number, familyId: string, now: Date) {
  const [family] = await db
    .update(authSessionFamilyTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(
      and(
        eq(authSessionFamilyTable.userId, userId),
        eq(authSessionFamilyTable.id, familyId),
        isNull(authSessionFamilyTable.revokedAt),
      ),
    )
    .returning({ id: authSessionFamilyTable.id })

  return family ?? null
}
