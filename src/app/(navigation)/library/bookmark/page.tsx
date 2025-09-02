import { desc, eq } from 'drizzle-orm'
import { BookmarkIcon } from 'lucide-react'
import { Metadata } from 'next'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { BOOKMARKS_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/drizzle'
import { bookmarkTable } from '@/database/schema'
import { getUserIdFromCookie } from '@/utils/session'

import BookmarkDownloadButton from './BookmarkDownloadButton'
import BookmarkPageClient from './BookmarkPageClient'
import BookmarkTooltip from './BookmarkTooltip'
import BookmarkUploadButton from './BookmarkUploadButton'
import Unauthorized from './Unauthorized'

export const metadata: Metadata = {
  title: `북마크 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `북마크 - ${SHORT_NAME}`,
    url: '/library/bookmark',
  },
  alternates: {
    canonical: '/library/bookmark',
    languages: { ko: '/library/bookmark' },
  },
}

export default async function BookmarkPage() {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return <Unauthorized />
  }

  const bookmarks = await db
    .select({
      mangaId: bookmarkTable.mangaId,
      createdAt: bookmarkTable.createdAt,
    })
    .from(bookmarkTable)
    .where(eq(bookmarkTable.userId, Number(userId)))
    .orderBy(desc(bookmarkTable.createdAt), desc(bookmarkTable.mangaId))
    .limit(BOOKMARKS_PER_PAGE + 1)

  if (bookmarks.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-4 p-8">
        <BookmarkIcon className="w-16 h-16 text-zinc-400" />
        <div className="text-center">
          <p className="text-zinc-500 text-lg">북마크가 비어 있어요</p>
          <p className="text-zinc-600 text-sm mt-2">마음에 드는 작품을 북마크해보세요</p>
        </div>
      </div>
    )
  }

  const hasNextPage = bookmarks.length > BOOKMARKS_PER_PAGE

  if (hasNextPage) {
    bookmarks.pop()
  }

  const initialBookmarks = bookmarks.map((b) => ({
    mangaId: b.mangaId,
    createdAt: b.createdAt.getTime(),
  }))

  const initialData = {
    bookmarks: initialBookmarks,
    nextCursor: hasNextPage ? initialBookmarks[initialBookmarks.length - 1] : null,
  }

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">북마크</h1>
      <div className="flex justify-center items-center gap-x-4 flex-wrap mt-4">
        <BookmarkDownloadButton />
        <BookmarkUploadButton />
        <BookmarkTooltip />
      </div>
      <BookmarkPageClient initialData={initialData} />
    </main>
  )
}
