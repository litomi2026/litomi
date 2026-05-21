import { db } from '@litomi/db/app'
import { userRatingTable } from '@litomi/db/app/activity'
import { and, count, desc, eq, gte, ne } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Star } from 'lucide-react'

import { getCatalogMangaMap } from '@/utils/catalog-manga.server'

import MangaCardList from './MangaCardList'

type Props = {
  mangaId: number
}

export default async function RecommendedByUsersSection({ mangaId }: Props) {
  const recommendedIds = await getRecommendedByUsers(mangaId)

  if (recommendedIds.length === 0) {
    return null
  }

  const catalogMangaMap = await getCatalogMangaMap(recommendedIds)

  return (
    <div className="border-b p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Star className="size-4" />이 작품과 함께 좋아한 작품
      </h3>
      <MangaCardList
        catalogMangas={recommendedIds.map((id) => catalogMangaMap.get(id))}
        mangaIds={recommendedIds.toReversed()}
      />
    </div>
  )
}

async function getRecommendedByUsers(mangaId: number): Promise<number[]> {
  const targetRating = alias(userRatingTable, 'target_rating')

  const result = await db
    .select({
      mangaId: userRatingTable.mangaId,
      score: count(),
    })
    .from(targetRating)
    .innerJoin(userRatingTable, eq(userRatingTable.userId, targetRating.userId))
    .where(
      and(
        eq(targetRating.mangaId, mangaId),
        gte(targetRating.rating, 4),
        ne(userRatingTable.mangaId, mangaId),
        gte(userRatingTable.rating, 4),
      ),
    )
    .groupBy(userRatingTable.mangaId)
    .orderBy(({ score }) => desc(score))
    .limit(10)

  return result.map((r) => r.mangaId)
}
