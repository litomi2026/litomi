import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import BookmarkDownloadButton from '@/app/(navigation)/(right-search)/[name]/bookmark/BookmarkDownloadButton'
import BookmarkUploadButton from '@/app/(navigation)/(right-search)/[name]/bookmark/BookmarkUploadButton'
import selectBookmarks from '@/sql/selectBookmarks'
import { PageProps } from '@/types/nextjs'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getUserById } from '../common'
import BookmarkList from './BookmarkList'
import BookmarkTooltip from './BookmarkTooltip'
import { BOOKMARKS_PER_PAGE } from './constants'
import { GuestView } from './GuestView'
import Loading from './loading'
import { PrivateBookmarksView } from './PrivateBookmarksView'
import RefreshButton from './RefreshButton'

type Params = {
  name: string
}

export default async function BookmarkPage({ params }: PageProps<Params>) {
  const [cookieStore, { name }] = await Promise.all([cookies(), params])
  const usernameFromParam = getUsernameFromParam(name)
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return <GuestView />
  }

  const user = await getUserById(userId)

  if (user.name !== usernameFromParam) {
    return <PrivateBookmarksView usernameFromLoginUser={user.name} usernameFromParam={usernameFromParam} />
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
