import { count, eq } from 'drizzle-orm'
import { BarChart3, Star } from 'lucide-react'
import { unstable_cache } from 'next/cache'

import { userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { sec } from '@/utils/format/date'

type Props = {
  mangaId: number
}

type RatingDistribution = {
  rating: number
  count: number
}

export default async function RatingDistributionSection({ mangaId }: Props) {
  const distribution = await getRatingDistribution(mangaId)
  const totalCount = distribution.reduce((sum, d) => sum + d.count, 0)

  if (totalCount === 0) {
    return null
  }

  const averageRating = distribution.reduce((sum, d) => sum + d.rating * d.count, 0) / totalCount
  const maxCount = Math.max(...distribution.map((d) => d.count))

  return (
    <details className="group border-b-2 p-4">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
            <BarChart3 className="size-4" />
            평점 분포
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="size-4 fill-brand text-brand" />
              <span className="text-lg font-bold text-zinc-100">{averageRating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-zinc-500">{totalCount}명</span>
          </div>
        </div>
      </summary>
      <div className="flex flex-col gap-2 mt-4">
        {[5, 4, 3, 2, 1].map((rating) => {
          const item = distribution.find((d) => d.rating === rating)
          const ratingCount = item?.count ?? 0
          const percentage = maxCount > 0 ? (ratingCount / maxCount) * 100 : 0

          return (
            <div className="flex items-center gap-2" key={rating}>
              <span className="w-6 text-sm text-zinc-400 text-right">{rating}</span>
              <Star className="size-3.5 text-brand" />
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition" style={{ width: `${percentage}%` }} />
              </div>
              <span className="w-8 text-xs text-zinc-500 text-right">{ratingCount}</span>
            </div>
          )
        })}
      </div>
    </details>
  )
}

const getRatingDistribution = unstable_cache(
  async (mangaId: number): Promise<RatingDistribution[]> =>
    db
      .select({
        rating: userRatingTable.rating,
        count: count(),
      })
      .from(userRatingTable)
      .where(eq(userRatingTable.mangaId, mangaId))
      .groupBy(userRatingTable.rating)
      .orderBy(userRatingTable.rating),
  ['rating-distribution'],
  { tags: ['rating-distribution'], revalidate: sec('1 week') },
)
