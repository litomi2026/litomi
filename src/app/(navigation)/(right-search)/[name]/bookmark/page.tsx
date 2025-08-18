import { desc, sql } from 'drizzle-orm'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import BookmarkDownloadButton from '@/app/(navigation)/(right-search)/[name]/bookmark/BookmarkDownloadButton'
import BookmarkUploadButton from '@/app/(navigation)/(right-search)/[name]/bookmark/BookmarkUploadButton'
import { Bookmark } from '@/app/api/bookmark/route'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { db } from '@/database/drizzle'
import { bookmarkTable } from '@/database/schema'
import { PageProps } from '@/types/nextjs'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getUserById, getUserByName } from '../common'
import BookmarkList from './BookmarkList'
import BookmarkTooltip from './BookmarkTooltip'
import { BOOKMARKS_PER_PAGE } from './constants'
import { GuestView } from './GuestView'
import Loading from './loading'
import { PrivateBookmarksView } from './PrivateBookmarksView'
import RefreshButton from './RefreshButton'

export const metadata: Metadata = {
  title: `북마크 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `북마크 - ${SHORT_NAME}`,
    url: '/@/bookmark',
  },
  alternates: {
    canonical: '/@/bookmark',
    languages: { ko: '/@/bookmark' },
  },
}

type Params = {
  name: string
}

export default async function BookmarkPage({ params }: PageProps<Params>) {
  const { name } = await params
  const usernameFromParam = getUsernameFromParam(name)
  const user = await getUserByName(usernameFromParam)

  // NOTE: 존재하지 않는 사용자
  if (!user) {
    return
  }

  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  // NOTE: 로그인하지 않았거나 name이 없는 경우
  if (!userId || !usernameFromParam) {
    return <GuestView />
  }

  const loginUser = await getUserById(userId)

  // NOTE: 로그인한 사용자와 name이 다른 경우
  if (loginUser.name !== usernameFromParam) {
    return <PrivateBookmarksView usernameFromLoginUser={loginUser.name} usernameFromParam={usernameFromParam} />
  }

  const bookmarkRows = await db
    .select({
      mangaId: bookmarkTable.mangaId,
      createdAt: bookmarkTable.createdAt,
    })
    .from(bookmarkTable)
    .where(sql`${bookmarkTable.userId} = ${userId}`)
    .orderBy(desc(bookmarkTable.createdAt), desc(bookmarkTable.mangaId))
    .limit(BOOKMARKS_PER_PAGE)

  if (bookmarkRows.length === 0) {
    notFound()
  }

  const bookmarks = bookmarkRows as unknown as Bookmark[]

  for (const bookmark of bookmarks) {
    bookmark.createdAt = (bookmark.createdAt as unknown as Date).getTime()
  }

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
