import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@litomi/domain/library/sort'
import { View } from '@litomi/std'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { generateOpenGraphMetadata } from '@/lib/metadata'

import BookmarkPageClient from './BookmarkPageClient'

export const metadata: Metadata = {
  title: '북마크',
  ...generateOpenGraphMetadata({
    title: '북마크',
    url: '/library/bookmark',
  }),
  alternates: {
    canonical: '/library/bookmark',
    languages: { ko: '/library/bookmark' },
  },
}

const searchParamsSchema = z.object({
  sort: z.enum(CollectionItemSort).default(DEFAULT_COLLECTION_ITEM_SORT),
  view: z.enum(View).default(View.CARD),
})

export default async function BookmarkPage({ searchParams }: PageProps<'/library/bookmark'>) {
  const validation = searchParamsSchema.safeParse(await searchParams)

  if (!validation.success) {
    redirect('/library/bookmark')
  }

  const { sort, view } = validation.data

  return <BookmarkPageClient initialSort={sort} initialView={view} />
}
