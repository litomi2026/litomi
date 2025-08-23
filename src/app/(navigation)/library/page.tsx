import { desc, eq } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { libraryItemTable, libraryTable } from '@/database/schema'
import { intToHexColor } from '@/utils/color'
import { getUserIdFromCookie } from '@/utils/session'

import AllLibraryMangaView from './AllLibraryMangaView'

export default async function LibraryPage() {
  const userId = await getUserIdFromCookie()

  let query = db
    .select({
      libraryId: libraryItemTable.libraryId,
      mangaId: libraryItemTable.mangaId,
      createdAt: libraryItemTable.createdAt,
      libraryName: libraryTable.name,
      libraryColor: libraryTable.color,
      libraryIcon: libraryTable.icon,
    })
    .from(libraryItemTable)
    .innerJoin(libraryTable, eq(libraryItemTable.libraryId, libraryTable.id))
    .orderBy(desc(libraryItemTable.createdAt), desc(libraryItemTable.mangaId))
    .$dynamic()

  if (userId) {
    query = query.where(eq(libraryTable.userId, Number(userId)))
  } else {
    query = query.where(eq(libraryTable.isPublic, true)).limit(20)
  }

  const libraryItemRows = await query
  const libraryItems = libraryItemRows.map((item) => ({ ...item, libraryColor: intToHexColor(item.libraryColor) }))

  return (
    <main className="flex-1">
      <h1 className="sr-only">모든 서재</h1>
      <AllLibraryMangaView initialItems={libraryItems} />
    </main>
  )
}
