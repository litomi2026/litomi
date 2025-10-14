import { desc, eq } from 'drizzle-orm'
import { Metadata } from 'next'

import { generateOpenGraphMetadata, SHORT_NAME } from '@/constants'
import { READING_HISTORY_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { userRatingTable } from '@/database/supabase/schema'
import { getUserIdFromCookie } from '@/utils/cookie'

import NotFound from './NotFound'
import Unauthorized from './Unauthorized'

export const metadata: Metadata = {
  title: '작품 평가',
  ...generateOpenGraphMetadata({
    title: `작품 평가 - ${SHORT_NAME}`,
    url: '/library/rating',
  }),
  alternates: {
    canonical: '/library/rating',
    languages: { ko: '/library/rating' },
  },
}

export default async function RatingPage() {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return <Unauthorized />
  }

  const ratings = await db
    .select({
      mangaId: userRatingTable.mangaId,
      rating: userRatingTable.rating,
      createdAt: userRatingTable.createdAt,
      updatedAt: userRatingTable.updatedAt,
    })
    .from(userRatingTable)
    .where(eq(userRatingTable.userId, userId))
    .orderBy(desc(userRatingTable.updatedAt), desc(userRatingTable.mangaId))
    .limit(READING_HISTORY_PER_PAGE + 1)

  if (ratings.length === 0) {
    return <NotFound />
  }

  const hasNextPage = ratings.length > READING_HISTORY_PER_PAGE

  if (hasNextPage) {
    ratings.pop()
  }

  const initialRatings = ratings.map((r) => ({
    mangaId: r.mangaId,
    rating: r.rating,
    createdAt: r.createdAt.getTime(),
    updatedAt: r.updatedAt.getTime(),
  }))

  const initialData = {
    items: initialRatings,
    nextCursor: hasNextPage ? initialRatings[initialRatings.length - 1] : null,
  }

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">작품 평가</h1>
      <div className="p-4 flex-1 flex flex-col">
        {/* TODO: Add rating list component here */}
        <pre className="text-xs text-zinc-500">{JSON.stringify(initialData, null, 2)}</pre>
      </div>
    </main>
  )
}
