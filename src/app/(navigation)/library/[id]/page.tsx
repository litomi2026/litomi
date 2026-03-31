import { and, eq, or } from 'drizzle-orm'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { z } from 'zod'

import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@/backend/api/v1/library/item-sort'
import { getNextCollectionItemCursor } from '@/backend/api/v1/library/item-sort.server'
import { generateOpenGraphMetadata } from '@/constants'
import { LIBRARY_ITEMS_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryTable } from '@/database/supabase/library'
import { selectLibraryItem } from '@/sql/selectLibraryItem'
import { getUserIdFromCookie } from '@/utils/cookie'
import { View } from '@/utils/param'

import LibraryItemsClient from './LibraryItemsClient'

const schema = z.object({
  id: z.coerce.number().int().positive(),
})

const searchParamsSchema = z.object({
  sort: z.enum(CollectionItemSort).default(DEFAULT_COLLECTION_ITEM_SORT),
  view: z.enum(View).default(View.CARD),
})

export async function generateMetadata({ params }: PageProps<'/library/[id]'>): Promise<Metadata> {
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data
  const userId = await getUserIdFromCookie()
  const library = await getLibrary(libraryId, userId)

  if (!library) {
    notFound()
  }

  const { description, name } = library

  return {
    title: name,
    ...generateOpenGraphMetadata({
      title: name,
      ...(description && { description }),
      url: `/library/${libraryId}`,
    }),
    alternates: {
      canonical: `/library/${libraryId}`,
      languages: { ko: `/library/${libraryId}` },
    },
  }
}

export default async function LibraryDetailPage({ params, searchParams }: PageProps<'/library/[id]'>) {
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const searchValidation = searchParamsSchema.safeParse(await searchParams)

  if (!searchValidation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data
  const userId = await getUserIdFromCookie()
  const library = await getLibrary(libraryId, userId)

  if (!library) {
    notFound()
  }

  const isOwner = library.userId === userId
  const sort = isOwner ? searchValidation.data.sort : DEFAULT_COLLECTION_ITEM_SORT

  const libraryItemRows = await selectLibraryItem({
    libraryId: library.id,
    sort,
    limit: LIBRARY_ITEMS_PER_PAGE + 1,
  })

  const hasNext = libraryItemRows.length > LIBRARY_ITEMS_PER_PAGE

  if (hasNext) {
    libraryItemRows.pop()
  }

  const items = libraryItemRows.map((item) => ({
    mangaId: item.mangaId,
    createdAt: item.createdAt.getTime(),
  }))

  const nextCursor = hasNext ? getNextCollectionItemCursor(libraryItemRows[libraryItemRows.length - 1]) : null
  const view = searchValidation.data.view

  return (
    <main className="flex-1 flex flex-col">
      <LibraryItemsClient
        initialItems={{ items, nextCursor }}
        initialSort={sort}
        initialView={view}
        isOwner={isOwner}
        library={library}
      />
    </main>
  )
}

const getLibrary = cache(async (libraryId: number, userId: number | null) => {
  const [library] = await db
    .select({
      id: libraryTable.id,
      name: libraryTable.name,
      description: libraryTable.description,
      icon: libraryTable.icon,
      color: libraryTable.color,
      isPublic: libraryTable.isPublic,
      userId: libraryTable.userId,
    })
    .from(libraryTable)
    .where(
      and(eq(libraryTable.id, libraryId), or(eq(libraryTable.userId, userId ?? 0), eq(libraryTable.isPublic, true))),
    )

  return library
})
