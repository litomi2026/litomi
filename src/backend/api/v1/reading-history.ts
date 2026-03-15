import { and, eq, sql, sum } from 'drizzle-orm'

import { EXPANSION_TYPE, POINT_CONSTANTS } from '@/constants/points'
import { MAX_READING_HISTORY_PER_USER } from '@/constants/policy'
import { readingHistoryTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { userExpansionTable } from '@/database/supabase/points'
import { userTable } from '@/database/supabase/user'

export type NormalizedReadingHistoryEntry = {
  mangaId: number
  lastPage: number
  updatedAt: Date
}

export type ReadingHistoryWriteInput = {
  mangaId: number
  lastPage: number
  updatedAt: number | Date
}

export type SessionDBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const excludedLastPage = sql`excluded.${sql.identifier(readingHistoryTable.lastPage.name)}`
const excludedUpdatedAt = sql`excluded.${sql.identifier(readingHistoryTable.updatedAt.name)}`

export function isIncomingReadingHistoryPreferred(
  current: Pick<NormalizedReadingHistoryEntry, 'lastPage' | 'updatedAt'>,
  incoming: Pick<NormalizedReadingHistoryEntry, 'lastPage' | 'updatedAt'>,
): boolean {
  const currentUpdatedAt = current.updatedAt.getTime()
  const incomingUpdatedAt = incoming.updatedAt.getTime()

  if (incomingUpdatedAt !== currentUpdatedAt) {
    return incomingUpdatedAt > currentUpdatedAt
  }

  return incoming.lastPage > current.lastPage
}

export function normalizeReadingHistoryEntries(
  items: Iterable<ReadingHistoryWriteInput>,
): NormalizedReadingHistoryEntry[] {
  const deduped = new Map<number, NormalizedReadingHistoryEntry>()

  for (const item of items) {
    const normalizedItem = {
      mangaId: item.mangaId,
      lastPage: item.lastPage,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt),
    }

    const current = deduped.get(normalizedItem.mangaId)

    if (!current || isIncomingReadingHistoryPreferred(current, normalizedItem)) {
      deduped.set(normalizedItem.mangaId, normalizedItem)
    }
  }

  return Array.from(deduped.values()).sort((left, right) => {
    const updatedAtDiff = right.updatedAt.getTime() - left.updatedAt.getTime()

    if (updatedAtDiff !== 0) {
      return updatedAtDiff
    }

    return right.mangaId - left.mangaId
  })
}

export async function syncReadingHistoriesTx(
  tx: SessionDBTransaction,
  userId: number,
  items: Iterable<ReadingHistoryWriteInput>,
) {
  const normalizedItems = normalizeReadingHistoryEntries(items)

  if (normalizedItems.length === 0) {
    return
  }

  await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

  await tx
    .insert(readingHistoryTable)
    .values(
      normalizedItems.map((item) => ({
        userId,
        mangaId: item.mangaId,
        lastPage: item.lastPage,
        updatedAt: item.updatedAt,
      })),
    )
    .onConflictDoUpdate({
      target: [readingHistoryTable.userId, readingHistoryTable.mangaId],
      set: {
        lastPage: excludedLastPage,
        updatedAt: excludedUpdatedAt,
      },
      setWhere: sql`
        ${excludedUpdatedAt} > ${readingHistoryTable.updatedAt}
        OR (
          ${excludedUpdatedAt} = ${readingHistoryTable.updatedAt}
          AND ${excludedLastPage} > ${readingHistoryTable.lastPage}
        )
      `,
    })

  const [expansion] = await tx
    .select({ totalAmount: sum(userExpansionTable.amount) })
    .from(userExpansionTable)
    .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, EXPANSION_TYPE.READING_HISTORY)))

  const extra = Number(expansion?.totalAmount ?? 0)
  const userHistoryLimit = Math.min(MAX_READING_HISTORY_PER_USER + extra, POINT_CONSTANTS.HISTORY_MAX_EXPANSION)

  await trimReadingHistoryTx(tx, userId, userHistoryLimit)
}

export async function trimReadingHistoryTx(tx: SessionDBTransaction, userId: number, limit: number) {
  await tx.execute(sql`
    DELETE FROM ${readingHistoryTable}
    WHERE ${readingHistoryTable.userId} = ${userId}
      AND (manga_id, updated_at) NOT IN (
        SELECT ${readingHistoryTable.mangaId}, ${readingHistoryTable.updatedAt}
        FROM ${readingHistoryTable}
        WHERE ${readingHistoryTable.userId} = ${userId}
        ORDER BY ${readingHistoryTable.updatedAt} DESC, ${readingHistoryTable.mangaId} DESC
        LIMIT ${limit}
      )
  `)
}
