import { decodeBookmarkCursor, encodeBookmarkCursor } from '@/common/cursor'
import { createCacheControl } from '@/crawler/proxy-utils'
import selectBookmarks from '@/sql/selectBookmarks'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { sec } from '@/utils/date'

import { GETBookmarksSchema } from './schema'

export type Bookmark = {
  mangaId: number
  createdAt: number
}

export type GETBookmarksResponse = {
  bookmarks: Bookmark[]
  nextCursor: string | null
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

  const { cursor, limit } = validation.data

  let cursorId
  let cursorTime

  if (cursor) {
    const decoded = decodeBookmarkCursor(cursor)

    if (!decoded) {
      return new Response('Bad Request', { status: 400 })
    }

    cursorId = decoded.mangaId.toString()
    cursorTime = new Date(decoded.timestamp).toISOString()
  }

  const bookmarkRows = await selectBookmarks({
    userId,
    limit: limit ? limit + 1 : undefined,
    cursorId,
    cursorTime,
  })

  if (bookmarkRows.length === 0) {
    return new Response(null, {
      status: 204,
      headers: {
        'Cache-Control': createCacheControl({
          private: true,
          maxAge: 3,
        }),
      },
    })
  }

  const hasNextPage = limit ? bookmarkRows.length > limit : false
  const bookmarks = hasNextPage ? bookmarkRows.slice(0, limit) : bookmarkRows
  const lastBookmark = bookmarks[bookmarks.length - 1]
  const nextCursor = hasNextPage ? encodeBookmarkCursor(lastBookmark.createdAt.getTime(), lastBookmark.mangaId) : null

  const result: GETBookmarksResponse = {
    bookmarks: bookmarks.map(({ mangaId, createdAt }) => ({
      mangaId,
      createdAt: createdAt.getTime(),
    })),
    nextCursor,
  }

  // NOTE: 로그인 후 다른 계정으로 로그인 시 이전 계정의 북마크 목록이 캐시되어 보여지는 이슈가 있음
  const cacheControl = cursor
    ? createCacheControl({
        private: true,
        maxAge: sec('10 minutes'),
      })
    : createCacheControl({
        private: true,
        maxAge: 3,
      })

  return Response.json(result, { headers: { 'Cache-Control': cacheControl } })
}
