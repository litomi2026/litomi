import { eq } from 'drizzle-orm'
import { db } from '../db'
import { userErasureTable } from '../schema/user'

export interface UserErasureRow {
  userId: number
}

export async function listUserErasures(limit: number): Promise<UserErasureRow[]> {
  return db
    .select({ userId: userErasureTable.userId })
    .from(userErasureTable)
    .orderBy(userErasureTable.createdAt)
    .limit(limit)
}

// Chat DB 파기가 끝난 뒤에만 호출 — 행이 남아 있는 한 다음 폴링에서 재시도됩니다.
export async function deleteUserErasure(userId: number): Promise<void> {
  await db.delete(userErasureTable).where(eq(userErasureTable.userId, userId))
}
