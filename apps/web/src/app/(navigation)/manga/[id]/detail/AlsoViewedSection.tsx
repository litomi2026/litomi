import { readingHistoryTable } from '@litomi/db/database/supabase/activity'
import { db } from '@litomi/db/database/supabase/drizzle'
import { sec } from '@litomi/std'
import { and, count, desc, ne, sql } from 'drizzle-orm'
import { Eye } from 'lucide-react'
import { unstable_cache } from 'next/cache'

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

const getAlsoViewed = unstable_cache(
  async (mangaId: number): Promise<number[]> => {
    const result = await db
      .select({
        mangaId: readingHistoryTable.mangaId,
        score: count(),
      })
      .from(readingHistoryTable)
      .where(
        and(
          sql`${readingHistoryTable.userId} IN (
            SELECT ${readingHistoryTable.userId}
            FROM ${readingHistoryTable}
            WHERE ${readingHistoryTable.mangaId} = ${mangaId}
          )`,
          ne(readingHistoryTable.mangaId, mangaId),
        ),
      )
      .groupBy(readingHistoryTable.mangaId)
      .orderBy(({ score }) => desc(score))
      .limit(10)

    return result.map((r) => r.mangaId)
  },
  ['also-viewed'],
  { tags: ['also-viewed'], revalidate: sec('1 week') },
)
