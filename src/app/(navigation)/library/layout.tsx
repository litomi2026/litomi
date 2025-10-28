import { desc, eq, or, sql } from 'drizzle-orm'

import { LIBRARIES_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import {
  bookmarkTable,
  libraryItemTable,
  libraryTable,
  readingHistoryTable,
  userRatingTable,
} from '@/database/supabase/schema'
import { intToHexColor } from '@/utils/color'
import { getUserIdFromCookie } from '@/utils/cookie'

import LibraryHeader from './LibraryHeader'
import LibrarySidebar from './LibrarySidebar'

export default async function LibraryLayout({ children }: LayoutProps<'/library'>) {
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
    .limit(LIBRARIES_PER_PAGE)
    .$dynamic()

  if (userId) {
    query = query
      .where(or(eq(libraryTable.userId, userId), eq(libraryTable.isPublic, true)))
      .orderBy(({ itemCount }) => [
        desc(eq(libraryTable.userId, userId)),
        desc(itemCount),
        desc(libraryTable.createdAt),
      ])
  } else {
    query = query
      .where(eq(libraryTable.isPublic, true))
      .orderBy(({ itemCount }) => [desc(itemCount), desc(libraryTable.createdAt)])
  }

  const libraryRows = await query
  const libraries = libraryRows.map((lib) => ({ ...lib, color: intToHexColor(lib.color) }))

  let bookmarkCount = 0
  let historyCount = 0
  let ratingCount = 0

  if (userId) {
    const [counts] = await db.execute<{
      bookmarkCount: number
      historyCount: number
      ratingCount: number
    }>(sql`
      SELECT 
        (SELECT COUNT(*)::int FROM ${bookmarkTable} WHERE ${bookmarkTable.userId} = ${userId}) as "bookmarkCount",
        (SELECT COUNT(*)::int FROM ${readingHistoryTable} WHERE ${readingHistoryTable.userId} = ${userId}) as "historyCount",
        (SELECT COUNT(*)::int FROM ${userRatingTable} WHERE ${userRatingTable.userId} = ${userId}) as "ratingCount"
    `)

    bookmarkCount = counts?.bookmarkCount ?? 0
    historyCount = counts?.historyCount ?? 0
    ratingCount = counts?.ratingCount ?? 0
  }

  return (
    <div className="flex-1 flex flex-col sm:flex-row">
      <LibrarySidebar
        bookmarkCount={bookmarkCount}
        className="fixed top-0 bottom-0 z-20 hidden flex-col bg-background overflow-y-auto scrollbar-hidden sm:flex lg:w-52"
        historyCount={historyCount}
        libraries={libraries}
        ratingCount={ratingCount}
        userId={userId}
      />
      <div className="hidden sm:block sm:w-[67px] lg:w-52" />
      <div className="flex flex-col flex-1">
        <LibraryHeader
          bookmarkCount={bookmarkCount}
          historyCount={historyCount}
          libraries={libraries}
          ratingCount={ratingCount}
          userId={userId}
        />
        {children}
      </div>
    </div>
  )
}
