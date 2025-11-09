import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { decodeBookmarkCursor, encodeBookmarkCursor } from '@/common/cursor'
import { BOOKMARKS_PER_PAGE } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import selectBookmarks from '@/sql/selectBookmarks'

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(BOOKMARKS_PER_PAGE).optional(),
})

export type Bookmark = {
  mangaId: number
  createdAt: number
}

export type GETV1BookmarkResponse = {
  bookmarks: Bookmark[]
  nextCursor: string | null
}

const bookmarkRoutes = new Hono<Env>()

bookmarkRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  const { cursor, limit } = c.req.valid('query')

  let cursorId
  let cursorTime

  if (cursor) {
    const decoded = decodeBookmarkCursor(cursor)

    if (!decoded) {
      throw new HTTPException(400)
    }

    cursorId = decoded.mangaId
    cursorTime = new Date(decoded.timestamp)
  }

  const bookmarkRows = await selectBookmarks({
    userId,
    limit: limit ? limit + 1 : undefined,
    cursorId,
    cursorTime,
  })

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 3,
  })

  const hasNextPage = limit ? bookmarkRows.length > limit : false
  const bookmarks = hasNextPage ? bookmarkRows.slice(0, limit) : bookmarkRows
  const lastBookmark = bookmarks[bookmarks.length - 1]
  const nextCursor = hasNextPage ? encodeBookmarkCursor(lastBookmark.createdAt.getTime(), lastBookmark.mangaId) : null

  const result = {
    bookmarks: bookmarks.map(({ mangaId, createdAt }) => ({
      mangaId,
      createdAt: createdAt.getTime(),
    })),
    nextCursor,
  }

  return c.json<GETV1BookmarkResponse>(result, { headers: { 'Cache-Control': cacheControl } })
})

export default bookmarkRoutes
