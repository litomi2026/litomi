import { bbatonVerificationTable } from '@litomi/db/database/supabase/bbaton'
import { db } from '@litomi/db/database/supabase/drizzle'
import { userTable } from '@litomi/db/database/supabase/user'
import { eq } from 'drizzle-orm'

export type AuthenticatedUserProfile = {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

export type AuthTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

type SelectExecutor = Pick<typeof db, 'select'>
type UpdateExecutor = Pick<typeof db, 'update'>

export async function readAdultFlag(userId: number, tx?: AuthTransaction) {
  const executor = (tx ?? db) as SelectExecutor

  const [verification] = await executor
    .select({ adultFlag: bbatonVerificationTable.adultFlag })
    .from(bbatonVerificationTable)
    .where(eq(bbatonVerificationTable.userId, userId))

  return verification?.adultFlag === true
}

export async function touchUserLoginAt(userId: number, now: Date, tx?: AuthTransaction) {
  const executor = (tx ?? db) as UpdateExecutor

  await executor.update(userTable).set({ loginAt: now }).where(eq(userTable.id, userId))
}

export async function touchUserLoginAtAndReturnProfile(userId: number, now: Date, tx?: AuthTransaction) {
  const executor = (tx ?? db) as UpdateExecutor

  const [user] = await executor.update(userTable).set({ loginAt: now }).where(eq(userTable.id, userId)).returning({
    id: userTable.id,
    loginId: userTable.loginId,
    name: userTable.name,
    lastLoginAt: userTable.loginAt,
    lastLogoutAt: userTable.logoutAt,
  })

  return user ?? null
}

export async function touchUserLogoutAtAndReturnLoginId(userId: number, now: Date) {
  const [user] = await db
    .update(userTable)
    .set({ logoutAt: now })
    .where(eq(userTable.id, userId))
    .returning({ loginId: userTable.loginId })

  return user ?? null
}
