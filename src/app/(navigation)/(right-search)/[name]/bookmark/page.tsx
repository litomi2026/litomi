import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import BookmarkDownloadButton from '@/app/(navigation)/(right-search)/[name]/bookmark/BookmarkDownloadButton'
import BookmarkUploadButton from '@/app/(navigation)/(right-search)/[name]/bookmark/BookmarkUploadButton'
import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import BookmarkList from './BookmarkList'
import BookmarkTooltip from './BookmarkTooltip'
import { BOOKMARKS_PER_PAGE } from './constants'
import { GuestView } from './GuestView'
import Loading from './loading'
import RefreshButton from './RefreshButton'

export default async function BookmarkPage() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return <GuestView />
  }

  // TODO(2025-07-16): 해당 사용자의 북마크 공개/비공개 판단하기
  // if (!loginIdFromToken) {
  //   return <GuestView />
  // }
  // if (loginIdFromToken !== loginIdFromParam) {
  //   return <PrivateBookmarksView attemptedLoginId={loginIdFromParam} currentUserLoginId={loginIdFromToken} />
  // }

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
        <BookmarkDownloadButton />
        <BookmarkUploadButton />
        <RefreshButton className="w-9 p-2 rounded-full transition hover:bg-zinc-800 active:bg-zinc-900" />
        <BookmarkTooltip />
      </div>
      <Suspense fallback={<Loading />}>
        <BookmarkList initialBookmarks={bookmarks} />
      </Suspense>
    </>
  )
}
