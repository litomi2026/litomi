import { and, eq, isNull } from 'drizzle-orm'
import 'server-only'

import { authSessionTable } from '@/database/supabase/auth'
import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'

export type SessionInsert = typeof authSessionTable.$inferInsert
export type SessionRow = typeof authSessionTable.$inferSelect
export type SessionTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
export type SessionWriteExecutor = Pick<SessionTransaction, 'insert'> | Pick<typeof db, 'insert'>

type InsertExecutor = Pick<typeof db, 'insert'>

export async function insertSession(values: SessionInsert, tx?: SessionWriteExecutor) {
  const executor = (tx ?? db) as InsertExecutor

  await executor.insert(authSessionTable).values(values)
}

export async function markSessionRotated(
  tx: SessionTransaction,
  sessionId: string,
  replacedBySessionId: string,
  now: Date,
) {
  await tx
    .update(authSessionTable)
    .set({
      rotatedAt: now,
      replacedBySessionId,
      lastUsedAt: now,
    })
    .where(eq(authSessionTable.id, sessionId))
}

export async function readAdultFlag(tx: SessionTransaction, userId: number) {
  const [verification] = await tx
    .select({ adultFlag: bbatonVerificationTable.adultFlag })
    .from(bbatonVerificationTable)
    .where(eq(bbatonVerificationTable.userId, userId))

  return verification?.adultFlag === true
}

export async function readSessionByIdForUpdate(tx: SessionTransaction, sessionId: string) {
  const [session] = await tx.select().from(authSessionTable).where(eq(authSessionTable.id, sessionId)).for('update')

  return session ?? null
}

export async function readSessionByTokenHashForUpdate(tx: SessionTransaction, tokenHash: string) {
  const [session] = await tx
    .select()
    .from(authSessionTable)
    .where(eq(authSessionTable.tokenHash, tokenHash))
    .for('update')

  return session ?? null
}

export async function revokeAllSessionsByUserId(userId: number, now: Date) {
  await db
    .update(authSessionTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionTable.userId, userId), isNull(authSessionTable.revokedAt)))
}

export async function revokeSessionById(tx: SessionTransaction, sessionId: string, now: Date) {
  await tx
    .update(authSessionTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionTable.id, sessionId), isNull(authSessionTable.revokedAt)))
}

export async function revokeSessionFamily(tx: SessionTransaction, familyId: string, now: Date) {
  await tx
    .update(authSessionTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionTable.familyId, familyId), isNull(authSessionTable.revokedAt)))
}
