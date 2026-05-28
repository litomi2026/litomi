import { RatingSort } from '@litomi/domain/library/sort'
import { View } from '@litomi/std'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { generateOpenGraphMetadata } from '@/lib/metadata'

import RatingPageClient from './RatingPageClient'

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
  view: z.enum(View).default(View.CARD),
})

export default async function RatingPage({ searchParams }: PageProps<'/library/rating'>) {
  const validation = searchParamsSchema.safeParse(await searchParams)

  if (!validation.success) {
    redirect('/library/rating')
  }

  const { sort, view } = validation.data

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">작품 평가</h1>
      <RatingPageClient initialSort={sort} initialView={view} />
    </main>
  )
}
