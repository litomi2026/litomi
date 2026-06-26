import { db } from '@litomi/db/app'
import { authSessionFamilyTable, authSessionTokenTable } from '@litomi/db/app/auth'
import { bbatonVerificationTable } from '@litomi/db/app/bbaton'
import { and, eq, isNull } from 'drizzle-orm'

export type SessionFamilyInsert = typeof authSessionFamilyTable.$inferInsert
export type SessionFamilyRow = typeof authSessionFamilyTable.$inferSelect
export type SessionTokenInsert = typeof authSessionTokenTable.$inferInsert
export type SessionTokenRow = typeof authSessionTokenTable.$inferSelect
export type SessionTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
export type SessionWriteExecutor = Pick<SessionTransaction, 'insert'> | Pick<typeof db, 'insert'>

type InsertExecutor = Pick<typeof db, 'insert'>

export async function insertSessionFamily(values: SessionFamilyInsert, tx?: SessionWriteExecutor) {
  const executor = (tx ?? db) as InsertExecutor
  await executor.insert(authSessionFamilyTable).values(values)
}

export async function insertSessionToken(values: SessionTokenInsert, tx?: SessionWriteExecutor) {
  const executor = (tx ?? db) as InsertExecutor
  await executor.insert(authSessionTokenTable).values(values)
}

export async function markSessionTokenRotated(
  tx: SessionTransaction,
  tokenId: string,
  replacedByTokenId: string,
  now: Date,
) {
  await tx
    .update(authSessionTokenTable)
    .set({
      rotatedAt: now,
      replacedByTokenId,
    })
    .where(eq(authSessionTokenTable.id, tokenId))
}

export async function readAdultFlag(tx: SessionTransaction, userId: number) {
  const [verification] = await tx
    .select({ adultFlag: bbatonVerificationTable.adultFlag })
    .from(bbatonVerificationTable)
    .where(eq(bbatonVerificationTable.userId, userId))

  return verification?.adultFlag === true
}

export async function readSessionFamilyByIdForUpdate(tx: SessionTransaction, familyId: string) {
  const [family] = await tx
    .select()
    .from(authSessionFamilyTable)
    .where(eq(authSessionFamilyTable.id, familyId))
    .for('update')

  return family ?? null
}

export async function readSessionTokenByHash(tx: SessionTransaction, tokenHash: string) {
  const [token] = await tx.select().from(authSessionTokenTable).where(eq(authSessionTokenTable.tokenHash, tokenHash))
  return token ?? null
}

export async function readSessionTokenById(tx: SessionTransaction, tokenId: string) {
  const [token] = await tx.select().from(authSessionTokenTable).where(eq(authSessionTokenTable.id, tokenId))
  return token ?? null
}

export async function revokeSessionFamilyById(tx: SessionTransaction, familyId: string, now: Date) {
  await tx
    .update(authSessionFamilyTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionFamilyTable.id, familyId), isNull(authSessionFamilyTable.revokedAt)))
}

export async function touchSessionFamily(
  tx: SessionTransaction,
  familyId: string,
  values: Pick<SessionFamilyRow, 'deviceLabel' | 'idleExpiresAt' | 'lastUsedAt'>,
) {
  await tx.update(authSessionFamilyTable).set(values).where(eq(authSessionFamilyTable.id, familyId))
}
