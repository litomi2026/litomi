import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

import { createCacheControl } from '@/crawler/proxy-utils'
import { BookmarkSource } from '@/database/schema'
import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import { BookmarksQuerySchema } from './schema'

export const revalidate = 10

export type BookmarkWithSource = {
  mangaId: number
  source: BookmarkSource
  createdAt?: number
}

export type GETBookmarksResponse = {
  bookmarks: BookmarkWithSource[]
  nextCursor: { mangaId: number; createdAt: number } | null
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return new Response('로그인 정보가 없거나 만료됐어요.', { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const validation = BookmarksQuerySchema.safeParse(params)

  if (!validation.success) {
    return new Response('400 Bad Request', { status: 400 })
  }

  const { cursorId, cursorTime, limit } = validation.data

  const bookmarkRows = await selectBookmarks({
    userId,
    limit: limit ? limit + 1 : undefined,
    cursorId: cursorId?.toString(),
    cursorTime: cursorTime ? new Date(cursorTime).toISOString() : undefined,
  })

  if (bookmarkRows.length === 0) {
    return new Response('404 Not Found', { status: 404 })
  }

  const hasNextPage = limit ? bookmarkRows.length > limit : false
  const bookmarks = hasNextPage ? bookmarkRows.slice(0, limit) : bookmarkRows
  const lastBookmark = bookmarks[bookmarks.length - 1]
  const nextCursor = hasNextPage
    ? {
        mangaId: lastBookmark.mangaId,
        createdAt: lastBookmark.createdAt.getTime(),
      }
    : null

  return Response.json(
    {
      bookmarks: bookmarks.map((bookmark) => ({ ...bookmark, createdAt: bookmark.createdAt.getTime() })),
      nextCursor,
    } satisfies GETBookmarksResponse,
    {
      headers: {
        'Cache-Control': createCacheControl({
          public: true,
          sMaxAge: revalidate,
          staleWhileRevalidate: revalidate,
        }),
      },
    },
  )
}
