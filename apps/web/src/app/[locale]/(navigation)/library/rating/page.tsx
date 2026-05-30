import { RatingSort } from '@litomi/domain/library/sort'
import { View } from '@litomi/std'
import { Metadata } from 'next'
import { z } from 'zod'

import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedPageMetadata } from '@/lib/metadata'

import RatingPageClient from './RatingPageClient'

export async function generateMetadata({ params }: PageProps<'/[locale]/library/rating'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)

  return {
    title: '작품 평가',
    ...generateLocalizedPageMetadata({
      title: '작품 평가',
      locale,
      pathname: '/library/rating',
    }),
  }
}

const searchParamsSchema = z.object({
  sort: z.enum(RatingSort).default(RatingSort.UPDATED_DESC),
  view: z.enum(View).default(View.CARD),
})

export default async function RatingPage({ params, searchParams }: PageProps<'/[locale]/library/rating'>) {
  const locale = await getLocaleFromParams(params)
  const validation = searchParamsSchema.safeParse(await searchParams)

  if (!validation.success) {
    return redirect({ href: '/library/rating', locale })
  }

  const { sort, view } = validation.data

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">작품 평가</h1>
      <RatingPageClient initialSort={sort} initialView={view} />
    </main>
  )
}
