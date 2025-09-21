import { desc, eq, sql } from 'drizzle-orm'
import { ReactNode } from 'react'

import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/schema'
import { intToHexColor } from '@/utils/color'
import { getUserIdFromCookie } from '@/utils/cookie'

import LibraryHeader from './LibraryHeader'
import LibrarySidebar from './LibrarySidebar'

type Props = {
  children: ReactNode
}

export default async function LibraryLayout({ children }: Props) {
  const userId = await getUserIdFromCookie()

  let query = db
    .select({
      id: libraryTable.id,
      userId: libraryTable.userId,
      name: libraryTable.name,
      description: libraryTable.description,
      color: libraryTable.color,
      icon: libraryTable.icon,
      isPublic: libraryTable.isPublic,
      createdAt: libraryTable.createdAt,
      itemCount: sql<number>`(SELECT COUNT(*) FROM ${libraryItemTable} WHERE ${libraryItemTable.libraryId} = ${libraryTable.id})::int`,
    })
    .from(libraryTable)
    .orderBy(({ itemCount }) => desc(itemCount))
    .$dynamic()

  if (userId) {
    query = query.where(eq(libraryTable.userId, userId))
  } else {
    query = query.where(eq(libraryTable.isPublic, true)).limit(20)
  }

  const libraryRows = await query
  const libraries = libraryRows.map((lib) => ({ ...lib, color: intToHexColor(lib.color) }))

  return (
    <div className="flex-1 flex flex-col sm:flex-row">
      <LibrarySidebar
        className="fixed top-0 bottom-0 z-20 hidden flex-col bg-background overflow-y-auto sm:flex lg:w-52"
        libraries={libraries}
        userId={userId}
      />
      <div className="hidden sm:block sm:w-[66px] lg:w-52" />
      <div className="flex flex-col flex-1">
        <LibraryHeader libraries={libraries} userId={userId} />
        {children}
      </div>
    </div>
  )
}
