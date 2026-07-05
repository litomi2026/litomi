import { type GETV1BookmarkResponse, getV1BookmarkQuerySchema } from '@litomi/contracts'
import { selectBookmark } from '@litomi/db/app/query/bookmark'
import { decodeBookmarkCursor } from '@litomi/db/cursor'
import { getNextLibraryItemCursor, type LibraryItemCursor } from '@litomi/db/sql/library-item-sort'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'
import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { getCatalogMangaMap } from '@/utils/catalog-manga'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  requireAdult,
  zProblemValidator('query', getV1BookmarkQuerySchema),
)

route.get('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!

  try {
    const { cursor, limit, locale, sort } = c.req.valid('query')

    let cursorData: LibraryItemCursor | undefined

    if (cursor) {
      const decoded = decodeBookmarkCursor(cursor)

      if (!decoded) {
        return problemResponse(c, { status: 400 })
      }

      cursorData = decoded
    }

    const bookmarkRows = await selectBookmark(userId, {
      limit: limit + 1,
      sort,
      cursor: cursorData,
    })

    const hasNextPage = bookmarkRows.length > limit
    const bookmarks = hasNextPage ? bookmarkRows.slice(0, limit) : bookmarkRows
    const lastBookmark = bookmarks[bookmarks.length - 1]
    const nextCursor = hasNextPage ? getNextLibraryItemCursor(lastBookmark) : null
    const mangaIds = bookmarks.map(({ mangaId }) => mangaId)
    const catalogMangaMap = await getCatalogMangaMap(mangaIds, locale)

    const response = {
      bookmarks: bookmarks.map(({ mangaId, createdAt }) => ({
        mangaId,
        createdAt: createdAt.getTime(),
        manga: catalogMangaMap.get(mangaId),
      })),
      nextCursor,
    } satisfies GETV1BookmarkResponse

    return c.json(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
