import { db } from '@litomi/db/app'
import 'server-only'
import { authSessionFamilyTable, authSessionTokenTable } from '@litomi/db/app/auth'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'

export async function readCurrentSessionFamilyIdByTokenHash(userId: number, tokenHash: string) {
  const [family] = await db
    .select({ id: authSessionFamilyTable.id })
    .from(authSessionTokenTable)
    .innerJoin(authSessionFamilyTable, eq(authSessionFamilyTable.id, authSessionTokenTable.familyId))
    .where(and(eq(authSessionFamilyTable.userId, userId), eq(authSessionTokenTable.tokenHash, tokenHash)))

  return family?.id ?? null
}

export async function readPersistentSessionFamiliesByUserId(userId: number, now: Date) {
  return await db
    .select({
      id: authSessionFamilyTable.id,
      createdAt: authSessionFamilyTable.createdAt,
      lastUsedAt: authSessionFamilyTable.lastUsedAt,
      absoluteExpiresAt: authSessionFamilyTable.absoluteExpiresAt,
      idleExpiresAt: authSessionFamilyTable.idleExpiresAt,
      deviceLabel: authSessionFamilyTable.deviceLabel,
    })
    .from(authSessionFamilyTable)
    .where(
      and(
        eq(authSessionFamilyTable.userId, userId),
        isNull(authSessionFamilyTable.revokedAt),
        gt(authSessionFamilyTable.absoluteExpiresAt, now),
        gt(authSessionFamilyTable.idleExpiresAt, now),
      ),
    )
    .orderBy(
      desc(authSessionFamilyTable.lastUsedAt),
      desc(authSessionFamilyTable.createdAt),
      desc(authSessionFamilyTable.id),
    )
}
