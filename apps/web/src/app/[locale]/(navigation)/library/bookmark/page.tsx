import type { Metadata } from 'next'

import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@litomi/domain/library/sort'
import { View } from '@litomi/std'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import BookmarkPageClient from './BookmarkPageClient'

export async function generateMetadata({ params }: PageProps<'/[locale]/library/bookmark'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.library.bookmark' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/library/bookmark',
    }),
  }
}

const searchParamsSchema = z.object({
  sort: z.enum(CollectionItemSort).default(DEFAULT_COLLECTION_ITEM_SORT),
  view: z.enum(View).default(View.CARD),
})

export default async function BookmarkPage({ params, searchParams }: PageProps<'/[locale]/library/bookmark'>) {
  const locale = await getLocaleFromParams(params)
  const validation = searchParamsSchema.safeParse(await searchParams)

  if (!validation.success) {
    return redirect({ href: '/library/bookmark', locale })
  }

  const { sort, view } = validation.data

  return <BookmarkPageClient initialSort={sort} initialView={view} />
}
