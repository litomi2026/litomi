import { eq, sql } from 'drizzle-orm'
import { ReactNode } from 'react'

import { db } from '@/database/drizzle'
import { libraryItemTable, libraryTable } from '@/database/schema'
import { getUserIdFromCookie } from '@/utils/session'

import LibrarySidebar from './LibrarySidebar'
import MobileLibraryHeader from './MobileLibraryHeader'
import { formatHexColor } from './utils'

type Props = {
  children: ReactNode
}

export default async function LibraryLayout({ children }: Props) {
  const userId = await getUserIdFromCookie()

  let libraries

  const query = db
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

  if (userId) {
    const libraryRows = await query.where(eq(libraryTable.userId, Number(userId))).orderBy(libraryTable.id)
    libraries = libraryRows.map((lib) => ({ ...lib, color: formatHexColor(lib.color) }))
  } else {
    const publicLibraries = await query.where(eq(libraryTable.isPublic, true)).orderBy(libraryTable.id).limit(20)
    libraries = publicLibraries.map((lib) => ({ ...lib, color: formatHexColor(lib.color) }))
  }

  return (
    <div className="flex-1 flex flex-col sm:flex-row">
      <LibrarySidebar libraries={libraries} username={userId} />
      <MobileLibraryHeader libraries={libraries} username={userId} />
      {children}
    </div>
  )
}
