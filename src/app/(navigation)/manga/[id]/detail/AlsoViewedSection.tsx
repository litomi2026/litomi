import { and, count, desc, ne, sql } from 'drizzle-orm'
import { Eye } from 'lucide-react'
import { unstable_cache } from 'next/cache'

import { db } from '@/database/supabase/drizzle'
import { readingHistoryTable } from '@/database/supabase/schema'
import { sec } from '@/utils/date'

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
    <div className="border-b-2 p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Eye className="size-4" />이 작품과 함께 본 작품
      </h3>
      <MangaCardList mangaIds={alsoViewedIds} />
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
