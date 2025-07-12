import { Suspense } from '@suspensive/react'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import BookmarkListClient from './BookmarkListClient'
import { BOOKMARKS_PER_PAGE } from './constants'
import { GuestView } from './GuestView'
import Loading from './loading'

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
    <Suspense clientOnly fallback={<Loading />}>
      <BookmarkListClient initialBookmarks={bookmarks} />
    </Suspense>
  )
}
