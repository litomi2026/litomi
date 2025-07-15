import { ErrorBoundary, Suspense } from '@suspensive/react'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import BookmarkImportButton, { BookmarkImportButtonSkeleton } from '@/components/BookmarkImportButton'
import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import BookmarkList from './BookmarkListClient'
import BookmarkTooltip from './BookmarkTooltip'
import { BOOKMARKS_PER_PAGE } from './constants'
import { GuestView } from './GuestView'
import Loading from './loading'
import RefreshButton from './RefreshButton'

export default async function BookmarkPage() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return <GuestView />
  }

  const bookmarkRows = await selectBookmarks({ userId, limit: BOOKMARKS_PER_PAGE })

  if (bookmarkRows.length === 0) {
    notFound()
  }

  const bookmarks = bookmarkRows.map((bookmark) => ({
    ...bookmark,
    createdAt: bookmark.createdAt.getTime(),
  }))

  return (
    <>
      <div className="flex justify-center items-center gap-x-4 flex-wrap">
        <ErrorBoundary fallback={BookmarkImportButtonSkeleton}>
          <Suspense clientOnly fallback={<BookmarkImportButtonSkeleton />}>
            <BookmarkImportButton />
          </Suspense>
        </ErrorBoundary>
        <BookmarkTooltip />
        <RefreshButton className="w-9 p-2 rounded-full transition hover:bg-zinc-800 active:bg-zinc-900" />
      </div>
      <Suspense clientOnly fallback={<Loading />}>
        <BookmarkList initialBookmarks={bookmarks} />
      </Suspense>
    </>
  )
}
