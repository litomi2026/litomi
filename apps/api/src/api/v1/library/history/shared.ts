import { db } from '@litomi/db/app'
import { readingHistoryTable } from '@litomi/db/app/activity'
import { userExpansionTable } from '@litomi/db/app/points'
import { EXPANSION_TYPE, POINT_CONSTANTS } from '@litomi/domain/constants/points'
import { MAX_READING_HISTORY_PER_USER } from '@litomi/domain/constants/policy'
import { and, desc, eq, notInArray, sum } from 'drizzle-orm'

export type SessionDBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function enforceHistoryLimit(tx: SessionDBTransaction, userId: number, limit: number) {
  await tx
    .delete(readingHistoryTable)
    .where(
      and(
        eq(readingHistoryTable.userId, userId),
        notInArray(
          readingHistoryTable.mangaId,
          tx
            .select({ mangaId: readingHistoryTable.mangaId })
            .from(readingHistoryTable)
            .where(eq(readingHistoryTable.userId, userId))
            .orderBy(desc(readingHistoryTable.updatedAt), desc(readingHistoryTable.mangaId))
            .limit(limit),
        ),
      ),
    )
}

export async function getUserHistoryLimitInTx(tx: SessionDBTransaction, userId: number): Promise<number> {
  const [expansion] = await tx
    .select({ totalAmount: sum(userExpansionTable.amount) })
    .from(userExpansionTable)
    .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, EXPANSION_TYPE.READING_HISTORY)))

  const extra = Number(expansion?.totalAmount ?? 0)
  return Math.min(MAX_READING_HISTORY_PER_USER + extra, POINT_CONSTANTS.HISTORY_MAX_EXPANSION)
}
