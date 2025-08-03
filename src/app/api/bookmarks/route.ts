import { createCacheControl } from '@/crawler/proxy-utils'
import { BookmarkSource } from '@/database/enum'
import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromCookie } from '@/utils/session'

import { GETBookmarksSchema } from './schema'

// NOTE: 로그인 후 다른 계정으로 로그인 시 이전 계정의 북마크 목록이 캐시되어 보여지는 이슈가 있음
const maxAge = 10

export type BookmarkWithSource = {
  mangaId: number
  source: BookmarkSource
  createdAt: number
}

export type GETBookmarksResponse = {
  bookmarks: BookmarkWithSource[]
  nextCursor: { mangaId: number; createdAt: number } | null
}

export async function GET(request: Request) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams)
  const validation = GETBookmarksSchema.safeParse(params)

  if (!validation.success) {
    return new Response('Bad Request', { status: 400 })
  }

  const { cursorId, cursorTime, limit } = validation.data

  const bookmarkRows = await selectBookmarks({
    userId,
    limit: limit ? limit + 1 : undefined,
    cursorId: cursorId?.toString(),
    cursorTime: cursorTime ? new Date(cursorTime).toISOString() : undefined,
  })

  const cacheControl = createCacheControl({
    private: true,
    maxAge,
    staleWhileRevalidate: maxAge,
  })

  if (bookmarkRows.length === 0) {
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': cacheControl },
    })
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
      bookmarks: bookmarks.map((bookmark) => ({
        ...bookmark,
        createdAt: bookmark.createdAt.getTime(),
      })),
      nextCursor,
    } satisfies GETBookmarksResponse,
    { headers: { 'Cache-Control': cacheControl } },
  )
}
