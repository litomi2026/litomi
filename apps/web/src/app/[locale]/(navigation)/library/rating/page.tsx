import type { Metadata } from 'next'

import { RatingSort } from '@litomi/domain/library/sort'
import { View } from '@litomi/std'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import RatingPageClient from './RatingPageClient'

export async function generateMetadata({ params }: PageProps<'/[locale]/library/rating'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.library.rating' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
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
  const t = await getTranslations({ locale, namespace: 'Metadata.library.rating' })

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">{t('title')}</h1>
      <RatingPageClient initialSort={sort} initialView={view} />
    </main>
  )
}
