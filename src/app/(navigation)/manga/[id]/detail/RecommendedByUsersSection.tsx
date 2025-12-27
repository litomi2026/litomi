import { and, count, desc, ne, sql } from 'drizzle-orm'
import { Star } from 'lucide-react'
import { unstable_cache } from 'next/cache'

import { userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { sec } from '@/utils/date'

import MangaCardList from './MangaCardList'

type Props = {
  mangaId: number
}

export default async function RecommendedByUsersSection({ mangaId }: Props) {
  const recommendedIds = await getRecommendedByUsers(mangaId)

  if (recommendedIds.length === 0) {
    return null
  }

  return (
    <div className="border-b-2 p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Star className="size-4" />이 작품과 함께 좋아한 작품
      </h3>
      <MangaCardList mangaIds={recommendedIds} />
    </div>
  )
}

const getRecommendedByUsers = unstable_cache(
  async (mangaId: number): Promise<number[]> => {
    const result = await db
      .select({
        mangaId: userRatingTable.mangaId,
        score: count(),
      })
      .from(userRatingTable)
      .where(
        and(
          sql`${userRatingTable.userId} IN (
            SELECT ${userRatingTable.userId}
            FROM ${userRatingTable}
            WHERE ${userRatingTable.mangaId} = ${mangaId}
              AND ${userRatingTable.rating} >= 4
          )`,
          ne(userRatingTable.mangaId, mangaId),
          sql`${userRatingTable.rating} >= 4`,
        ),
      )
      .groupBy(userRatingTable.mangaId)
      .orderBy(({ score }) => desc(score))
      .limit(10)

    return result.map((r) => r.mangaId)
  },
  ['recommended-by-users'],
  { tags: ['recommended-by-users'], revalidate: sec('1 week') },
)
