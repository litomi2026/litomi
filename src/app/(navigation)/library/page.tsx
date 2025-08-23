import { desc, eq } from 'drizzle-orm'
import { Folder } from 'lucide-react'

import { db } from '@/database/drizzle'
import { libraryItemTable, libraryTable } from '@/database/schema'
import { intToHexColor } from '@/utils/color'
import { getUserIdFromCookie } from '@/utils/session'

import AllLibraryMangaView from './AllLibraryMangaView'
import CreateLibraryButton from './CreateLibraryButton'

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

  const libraryItems = libraryItemRows.map((item) => ({
    mangaId: item.mangaId,
    createdAt: item.createdAt.getTime(),
    library: {
      id: item.libraryId,
      name: item.libraryName,
      color: intToHexColor(item.libraryColor),
      icon: item.libraryIcon,
    },
  }))

  if (libraryItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="sr-only">모든 서재</h1>
        <Folder className="size-24 sm:size-32 mx-auto mb-4 sm:mb-6 text-zinc-700" />
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">아직 서재가 없어요</h2>
        <p className="text-sm sm:text-base text-zinc-500 mb-6 sm:mb-8">서재를 만들어 만화를 체계적으로 관리해보세요</p>
        <CreateLibraryButton />
      </div>
    )
  }

  return (
    <main className="flex-1">
      <h1 className="sr-only">모든 서재</h1>
      <AllLibraryMangaView initialItems={libraryItems} />
    </main>
  )
}
