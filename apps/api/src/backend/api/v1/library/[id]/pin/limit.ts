import { and, eq, sum } from 'drizzle-orm'

import { EXPANSION_TYPE, POINT_CONSTANTS } from '@/constants/points'
import { MAX_PINNED_LIBRARIES_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { userExpansionTable } from '@/database/supabase/points'

export type PinnedLibraryTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function getPinnedLibraryLimit(tx: PinnedLibraryTx, userId: number): Promise<number> {
  const [expansion] = await tx
    .select({ totalAmount: sum(userExpansionTable.amount) })
    .from(userExpansionTable)
    .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, EXPANSION_TYPE.PINNED_LIBRARY)))

  const extra = Number(expansion?.totalAmount ?? 0)
  return Math.min(MAX_PINNED_LIBRARIES_PER_USER + extra, POINT_CONSTANTS.PINNED_LIBRARY_MAX_EXPANSION)
}
