import { db } from '@litomi/db/app'
import { readingHistoryTable } from '@litomi/db/app/activity'
import { and, count, desc, eq, ne } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Eye } from 'lucide-react'

import MangaCardList from './MangaCardList'

type Props = {
  mangaId: number
}

export default async function AlsoViewedSection({ mangaId }: Props) {
  const alsoViewedIds = await getAlsoViewed(mangaId)

  if (alsoViewedIds.length === 0) {
    return null
  }

  return (
    <div className="border-b p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Eye className="size-4" />이 작품과 함께 본 작품
      </h3>
      <MangaCardList mangaIds={alsoViewedIds.toReversed()} />
    </div>
  )
}

async function getAlsoViewed(mangaId: number): Promise<number[]> {
  const targetHistory = alias(readingHistoryTable, 'target_history')

  const result = await db
    .select({
      mangaId: readingHistoryTable.mangaId,
      score: count(),
    })
    .from(targetHistory)
    .innerJoin(readingHistoryTable, eq(readingHistoryTable.userId, targetHistory.userId))
    .where(and(eq(targetHistory.mangaId, mangaId), ne(readingHistoryTable.mangaId, mangaId)))
    .groupBy(readingHistoryTable.mangaId)
    .orderBy(({ score }) => desc(score))
    .limit(10)

  return result.map((r) => r.mangaId)
}
