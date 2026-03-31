import { Metadata } from 'next'
import { z } from 'zod'

import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@/backend/api/v1/library/item-sort'
import { getNextCollectionItemCursor } from '@/backend/api/v1/library/item-sort.server'
import { LIBRARY_NON_ADULT_AD_LAYOUT } from '@/components/ads/juicy-ads/layouts'
import NonAdultJuicyAdsBanner from '@/components/ads/juicy-ads/NonAdultJuicyAdsBanner'
import { generateOpenGraphMetadata } from '@/constants'
import { BOOKMARKS_PER_PAGE } from '@/constants/policy'
import { selectBookmark } from '@/sql/selectBookmark'
import { getUserIdFromCookie } from '@/utils/cookie'
import { View } from '@/utils/param'

import BookmarkPageClient from './BookmarkPageClient'
import NotFound from './NotFound'
import Unauthorized from './Unauthorized'

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
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return <Unauthorized />
  }

  const resolvedSearchParams = await searchParams
  const validation = searchParamsSchema.safeParse(resolvedSearchParams)

  if (!validation.success) {
    return <NotFound />
  }

  const { sort, view } = validation.data

  const bookmarks = await selectBookmark({
    userId,
    sort,
    limit: BOOKMARKS_PER_PAGE + 1,
  })

  if (bookmarks.length === 0) {
    return <NotFound />
  }

  const hasNextPage = bookmarks.length > BOOKMARKS_PER_PAGE

  if (hasNextPage) {
    bookmarks.pop()
  }

  const initialData = {
    bookmarks: bookmarks.map((b) => ({
      mangaId: b.mangaId,
      createdAt: b.createdAt.getTime(),
    })),
    nextCursor: hasNextPage ? getNextCollectionItemCursor(bookmarks[bookmarks.length - 1]) : null,
  }

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">북마크</h1>
      <NonAdultJuicyAdsBanner className="mx-2 mt-2" layout={LIBRARY_NON_ADULT_AD_LAYOUT} />
      <BookmarkPageClient initialData={initialData} initialSort={sort} initialView={view} />
    </main>
  )
}
