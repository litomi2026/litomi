import { CollectionItemSort } from '@/backend/api/v1/library/item-sort'
import { getNextCollectionItemCursor } from '@/backend/api/v1/library/item-sort.server'
import { LIBRARY_ITEMS_PER_PAGE } from '@/constants/policy'
import { selectLibraryItem } from '@/sql/selectLibraryItem'

import LibraryItemsClient from './LibraryItemsClient'

type Props = {
  library: {
    id: number
    name: string
    isPublic: boolean
  }
  isOwner: boolean
  initialSort: CollectionItemSort
}

export default async function LibraryItems({ library, isOwner, initialSort }: Props) {
  const libraryItemRows = await selectLibraryItem({
    libraryId: library.id,
    sort: initialSort,
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

  const nextCursor = hasNext ? getNextCollectionItemCursor(libraryItemRows[libraryItemRows.length - 1]!) : null

  return (
    <LibraryItemsClient
      initialItems={{ items, nextCursor }}
      initialSort={initialSort}
      isOwner={isOwner}
      library={library}
    />
  )
}
