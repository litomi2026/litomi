import { desc, eq } from 'drizzle-orm'
import { Library } from 'lucide-react'
import { Metadata } from 'next'

import { generateOpenGraphMetadata, SHORT_NAME } from '@/constants'
import { LIBRARY_ITEMS_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/schema'
import { intToHexColor } from '@/utils/color'
import { getUserIdFromCookie } from '@/utils/cookie'

import AllLibraryMangaView from './AllLibraryMangaView'
import CreateLibraryButton from './CreateLibraryButton'

export const metadata: Metadata = {
  title: '서재',
  ...generateOpenGraphMetadata({
    title: '서재',
    url: '/library',
  }),
  alternates: {
    canonical: '/library',
    languages: { ko: '/library' },
  },
}

export default async function LibraryPage() {
  const userId = await getUserIdFromCookie()

  let query = db
    .selectDistinctOn([libraryItemTable.mangaId], {
      libraryId: libraryItemTable.libraryId,
      mangaId: libraryItemTable.mangaId,
      createdAt: libraryItemTable.createdAt,
      libraryName: libraryTable.name,
      libraryColor: libraryTable.color,
      libraryIcon: libraryTable.icon,
    })
    .from(libraryItemTable)
    .innerJoin(libraryTable, eq(libraryItemTable.libraryId, libraryTable.id))
    .orderBy(desc(libraryItemTable.mangaId))
    .limit(LIBRARY_ITEMS_PER_PAGE)
    .$dynamic()

  if (userId) {
    query = query.where(eq(libraryTable.userId, userId))
  } else {
    query = query.where(eq(libraryTable.isPublic, true))
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
    if (userId) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 className="sr-only">모든 서재</h1>
          <Library className="size-24 sm:size-32 mx-auto mb-4 sm:mb-6 text-zinc-700" />
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">아직 서재가 없어요</h2>
          <p className="text-sm sm:text-base text-zinc-500 mb-6 sm:mb-8">
            서재를 만들어 작품을 체계적으로 관리해보세요
          </p>
          <CreateLibraryButton className="justify-center" />
        </div>
      )
    } else {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 className="sr-only">모든 서재</h1>
          <Library className="size-24 sm:size-32 mx-auto mb-4 sm:mb-6 text-zinc-700" />
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">공개된 서재가 없어요</h2>
          <p className="text-sm sm:text-base text-zinc-500 mb-6 sm:mb-8">다른 사용자들이 공개한 서재가 아직 없어요</p>
        </div>
      )
    }
  }

  return (
    <main className="flex-1">
      <AllLibraryMangaView initialItems={libraryItems} />
    </main>
  )
}
