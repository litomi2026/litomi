import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@litomi/domain/library/sort'
import { View } from '@litomi/std'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedPageMetadata } from '@/lib/metadata'

import LibraryItemsClient from './LibraryItemsClient'

const schema = z.object({
  id: z.coerce.number().int().positive(),
})

const searchParamsSchema = z.object({
  sort: z.enum(CollectionItemSort).default(DEFAULT_COLLECTION_ITEM_SORT),
  view: z.enum(View).default(View.CARD),
})

export async function generateMetadata({ params }: PageProps<'/[locale]/library/[id]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data
  const title = '서재'

  return {
    title,
    ...generateLocalizedPageMetadata({
      title,
      locale,
      pathname: `/library/${libraryId}`,
    }),
  }
}

export default async function LibraryDetailPage({ params, searchParams }: PageProps<'/[locale]/library/[id]'>) {
  const locale = await getLocaleFromParams(params)
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data
  const searchValidation = searchParamsSchema.safeParse(await searchParams)

  if (!searchValidation.success) {
    return redirect({ href: `/library/${libraryId}`, locale })
  }

  const { sort, view } = searchValidation.data

  return <LibraryItemsClient initialSort={sort} initialView={view} libraryId={libraryId} />
}
