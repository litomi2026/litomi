import { desc, eq } from 'drizzle-orm'
import { Metadata } from 'next'

import { encodeBookmarkCursor } from '@/common/cursor'
import { generateOpenGraphMetadata } from '@/constants'
import { BOOKMARKS_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { bookmarkTable } from '@/database/supabase/schema'
import { getUserIdFromCookie } from '@/utils/cookie'

import BookmarkDownloadButton from './BookmarkDownloadButton'
import BookmarkPageClient from './BookmarkPageClient'
import BookmarkTooltip from './BookmarkTooltip'
import BookmarkUploadButton from './BookmarkUploadButton'
import NotFound from './NotFound'
import Unauthorized from './Unauthorized'

export const metadata: Metadata = {
  title: '북마크',
  ...generateOpenGraphMetadata({
    title: '북마크',
    url: '/library/bookmark',
  }),
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
    .where(eq(bookmarkTable.userId, userId))
    .orderBy(desc(bookmarkTable.createdAt), desc(bookmarkTable.mangaId))
    .limit(BOOKMARKS_PER_PAGE + 1)

  if (bookmarks.length === 0) {
    return <NotFound />
  }

  const hasNextPage = bookmarks.length > BOOKMARKS_PER_PAGE

  if (hasNextPage) {
    bookmarks.pop()
  }

  const initialBookmarks = bookmarks.map((b) => ({
    mangaId: b.mangaId,
    createdAt: b.createdAt.getTime(),
  }))

  const lastBookmark = initialBookmarks[initialBookmarks.length - 1]

  const initialData = {
    bookmarks: initialBookmarks,
    nextCursor: hasNextPage ? encodeBookmarkCursor(lastBookmark.createdAt, lastBookmark.mangaId) : null,
  }

  return (
    <main className="flex-1 flex flex-col">
      <h1 className="sr-only">북마크</h1>
      <div className="flex justify-center items-center gap-x-2 flex-wrap mt-2">
        <BookmarkDownloadButton />
        <BookmarkUploadButton />
        <BookmarkTooltip />
      </div>
      <BookmarkPageClient initialData={initialData} />
    </main>
  )
}
