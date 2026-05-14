import { eq } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'

export type UserRowLockTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function lockUserRowForUpdate(tx: UserRowLockTx, userId: number) {
  await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')
}
