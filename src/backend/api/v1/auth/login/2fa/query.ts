import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { twoFactorBackupCodeTable, twoFactorTable } from '@/database/supabase/two-factor'

export type TwoFactorTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function deleteBackupCodeByHash(tx: TwoFactorTransaction, userId: number, codeHash: string) {
  await tx
    .delete(twoFactorBackupCodeTable)
    .where(and(eq(twoFactorBackupCodeTable.userId, userId), eq(twoFactorBackupCodeTable.codeHash, codeHash)))
}

export async function readActiveTwoFactorByUserId(tx: TwoFactorTransaction, userId: number) {
  const [twoFactor] = await tx
    .select({ secret: twoFactorTable.secret })
    .from(twoFactorTable)
    .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

  return twoFactor ?? null
}

export async function readBackupCodeHashesByUserId(tx: TwoFactorTransaction, userId: number) {
  return await tx
    .select({ codeHash: twoFactorBackupCodeTable.codeHash })
    .from(twoFactorBackupCodeTable)
    .where(eq(twoFactorBackupCodeTable.userId, userId))
}

export async function touchTwoFactorLastUsedAt(tx: TwoFactorTransaction, userId: number, now: Date) {
  await tx.update(twoFactorTable).set({ lastUsedAt: now }).where(eq(twoFactorTable.userId, userId))
}
