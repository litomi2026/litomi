import { desc, eq } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { libraryItemTable } from '@/database/schema'

import LibraryItemsClient from './LibraryItemsClient'

type Props = {
  library: {
    id: number
    name: string
  }
}

export default async function LibraryItems({ library }: Readonly<Props>) {
  const libraryItems = await db
    .select({
      createdAt: libraryItemTable.createdAt,
      libraryId: libraryItemTable.libraryId,
      mangaId: libraryItemTable.mangaId,
    })
    .from(libraryItemTable)
    .where(eq(libraryItemTable.libraryId, library.id))
    .orderBy(desc(libraryItemTable.createdAt), desc(libraryItemTable.mangaId))
    .limit(20)

  return <LibraryItemsClient initialItems={libraryItems} library={library} />
}
