import { eq, sql } from 'drizzle-orm'
import { ReactNode } from 'react'

import { db } from '@/database/drizzle'
import { libraryItemTable, libraryTable } from '@/database/schema'
import { intToHexColor } from '@/utils/color'
import { getUserIdFromCookie } from '@/utils/session'

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
    .orderBy(libraryTable.id)
    .$dynamic()

  if (userId) {
    query = query.where(eq(libraryTable.userId, Number(userId)))
  } else {
    query = query.where(eq(libraryTable.isPublic, true)).limit(20)
  }

  const libraryRows = await query
  const libraries = libraryRows.map((lib) => ({ ...lib, color: intToHexColor(lib.color) }))

  return (
    <div className="flex-1 flex flex-col sm:flex-row">
      <LibrarySidebar className="max-sm:hidden flex flex-col max-w-52" libraries={libraries} userId={userId} />
      <div className="flex flex-col flex-1">
        <LibraryHeader libraries={libraries} userId={userId} />
        {children}
      </div>
    </div>
  )
}
