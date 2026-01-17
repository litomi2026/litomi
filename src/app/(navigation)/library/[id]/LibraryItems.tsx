import { desc, eq } from 'drizzle-orm'

import { encodeLibraryIdCursor } from '@/common/cursor'
import { LIBRARY_ITEMS_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable } from '@/database/supabase/library'

import LibraryItemsClient from './LibraryItemsClient'

type Props = {
  library: {
    id: number
    name: string
    isPublic: boolean
  }
  isOwner: boolean
}

export default async function LibraryItems({ library, isOwner }: Readonly<Props>) {
  const libraryItemRows = await db
    .select({
      mangaId: libraryItemTable.mangaId,
      createdAt: libraryItemTable.createdAt,
    })
    .from(libraryItemTable)
    .where(eq(libraryItemTable.libraryId, library.id))
    .orderBy(desc(libraryItemTable.createdAt), desc(libraryItemTable.mangaId))
    .limit(LIBRARY_ITEMS_PER_PAGE + 1)

  const hasNext = libraryItemRows.length > LIBRARY_ITEMS_PER_PAGE

  if (hasNext) {
    libraryItemRows.pop()
  }

  const items = libraryItemRows.map((item) => ({
    mangaId: item.mangaId,
    createdAt: item.createdAt.getTime(),
  }))

  const nextCursor = hasNext
    ? encodeLibraryIdCursor(items[items.length - 1].createdAt, items[items.length - 1].mangaId)
    : null

  return <LibraryItemsClient initialItems={{ items, nextCursor }} isOwner={isOwner} library={library} />
}
