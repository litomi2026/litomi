import { desc, eq } from 'drizzle-orm'
import { Metadata } from 'next'
import { z } from 'zod'

import { RatingSort } from '@/backend/api/v1/library/enum'
import { encodeRatingCursor } from '@/common/cursor'
import { generateOpenGraphMetadata } from '@/constants'
import { RATING_PER_PAGE } from '@/constants/policy'
import { userRatingTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { getUserIdFromCookie } from '@/utils/cookie'

import NotFound from './NotFound'
import RatingPageClient from './RatingPageClient'
import Unauthorized from './Unauthorized'

export const metadata: Metadata = {
  title: '작품 평가',
  ...generateOpenGraphMetadata({
    title: '작품 평가',
    url: '/library/rating',
  }),
  alternates: {
    canonical: '/library/rating',
    languages: { ko: '/library/rating' },
  },
}

const searchParamsSchema = z.object({
  sort: z.enum(RatingSort).default(RatingSort.UPDATED_DESC),
})

export default async function RatingPage({ searchParams }: PageProps<'/library/rating'>) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return <Unauthorized />
  }

  const validation = searchParamsSchema.safeParse(await searchParams)

  if (!validation.success) {
    return <NotFound />
  }

  const { sort } = validation.data

  const baseQuery = db
    .select({
      mangaId: userRatingTable.mangaId,
      rating: userRatingTable.rating,
      createdAt: userRatingTable.createdAt,
      updatedAt: userRatingTable.updatedAt,
    })
    .from(userRatingTable)
    .where(eq(userRatingTable.userId, userId))
    .limit(RATING_PER_PAGE + 1)

  let ratings

  switch (sort) {
    case RatingSort.CREATED_DESC:
      ratings = await baseQuery.orderBy(desc(userRatingTable.createdAt), desc(userRatingTable.mangaId))
      break
    case RatingSort.RATING_ASC:
      ratings = await baseQuery.orderBy(
        userRatingTable.rating,
        desc(userRatingTable.updatedAt),
        desc(userRatingTable.mangaId),
      )
      break
    case RatingSort.RATING_DESC:
      ratings = await baseQuery.orderBy(
        desc(userRatingTable.rating),
        desc(userRatingTable.updatedAt),
        desc(userRatingTable.mangaId),
      )
      break
    case RatingSort.UPDATED_DESC:
    default:
      ratings = await baseQuery.orderBy(desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId))
      break
  }

  if (ratings.length === 0) {
    return <NotFound />
  }

  const hasNextPage = ratings.length > RATING_PER_PAGE

  if (hasNextPage) {
    ratings.pop()
  }

  const initialRatings = ratings.map((r) => ({
    mangaId: r.mangaId,
    rating: r.rating,
    createdAt: r.createdAt.getTime(),
    updatedAt: r.updatedAt.getTime(),
  }))

  let nextCursor: string | null = null

  if (hasNextPage && initialRatings.length > 0) {
    const { rating, createdAt, updatedAt, mangaId } = initialRatings[initialRatings.length - 1]

    switch (sort) {
      case RatingSort.CREATED_DESC:
        nextCursor = encodeRatingCursor(rating, createdAt, mangaId)
        break
      case RatingSort.RATING_ASC:
      case RatingSort.RATING_DESC:
        nextCursor = encodeRatingCursor(rating, updatedAt, mangaId)
        break
      case RatingSort.UPDATED_DESC:
      default:
        nextCursor = encodeRatingCursor(rating, updatedAt, mangaId)
        break
    }
  }

  const initialData = {
    items: initialRatings,
    nextCursor,
  }

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">작품 평가</h1>
      <RatingPageClient initialData={initialData} initialSort={sort} />
    </main>
  )
}
