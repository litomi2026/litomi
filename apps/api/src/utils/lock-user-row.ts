import type { db } from '@litomi/db/app'
import { userTable } from '@litomi/db/app/user'
import { eq } from 'drizzle-orm'

export type UserRowLockTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function lockUserRowForUpdate(tx: UserRowLockTx, userId: number) {
  await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')
}
