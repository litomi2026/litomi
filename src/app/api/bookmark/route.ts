import { createCacheControl } from '@/crawler/proxy-utils'
import selectBookmarks from '@/sql/selectBookmarks'
import { validateUserIdFromCookie } from '@/utils/cookie'

import { GETBookmarksSchema } from './schema'

export type Bookmark = {
  mangaId: number
  createdAt: number
}

export type GETBookmarksResponse = {
  bookmarks: Bookmark[]
  nextCursor: { mangaId: number; createdAt: number } | null
}

export async function GET(request: Request) {
  const userId = await validateUserIdFromCookie()

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

  // NOTE: 로그인 후 다른 계정으로 로그인 시 이전 계정의 북마크 목록이 캐시되어 보여지는 이슈가 있음
  const cacheControl = createCacheControl({
    private: true,
    maxAge: 30,
    swr: 10,
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
      bookmarks: bookmarks.map(({ mangaId, createdAt }) => ({
        mangaId,
        createdAt: createdAt.getTime(),
      })),
      nextCursor,
    } satisfies GETBookmarksResponse,
    { headers: { 'Cache-Control': cacheControl } },
  )
}
