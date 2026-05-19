import type { Manga } from '@litomi/domain/types/manga'

import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@litomi/contracts'
import { litomiClient } from '@litomi/crawler/crawler/litomi'
import { getNextCollectionItemCursor } from '@litomi/db/sql/collection-item-sort'
import { selectBookmark } from '@litomi/db/query/bookmark'
import { decodeBookmarkCursor } from '@litomi/domain/common/cursor'
import { BOOKMARKS_PER_PAGE } from '@litomi/domain/constants/policy'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(BOOKMARKS_PER_PAGE).default(BOOKMARKS_PER_PAGE),
  sort: z.enum(CollectionItemSort).default(DEFAULT_COLLECTION_ITEM_SORT),
})

export type Bookmark = {
  mangaId: number
  createdAt: number
  manga?: Manga
}

export type GETV1BookmarkResponse = {
  bookmarks: Bookmark[]
  nextCursor: string | null
}

const route = new Hono<Env>()

route.get('/', requireAuth, zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')!

  try {
    const { cursor, limit, sort } = c.req.valid('query')

    let cursorMangaId: number | undefined
    let cursorTime: Date | undefined

    if (cursor) {
      const decoded = decodeBookmarkCursor(cursor)

      if (!decoded) {
        return problemResponse(c, { status: 400 })
      }

      cursorMangaId = decoded.mangaId
      cursorTime = new Date(decoded.timestamp)
    }

    const bookmarkRows = await selectBookmark({
      userId,
      limit: limit + 1,
      sort,
      ...(cursorTime && cursorMangaId ? { cursorMangaId, cursorTime } : {}),
    })

    const hasNextPage = bookmarkRows.length > limit
    const bookmarks = hasNextPage ? bookmarkRows.slice(0, limit) : bookmarkRows
    const lastBookmark = bookmarks[bookmarks.length - 1]
    const nextCursor = hasNextPage ? getNextCollectionItemCursor(lastBookmark) : null
    const catalogMangaMap = await litomiClient.getMangas(bookmarks.map(({ mangaId }) => mangaId))

    const response = {
      bookmarks: bookmarks.map(({ mangaId, createdAt }) => ({
        mangaId,
        createdAt: createdAt.getTime(),
        manga: catalogMangaMap.get(mangaId),
      })),
      nextCursor,
    }

    return c.json<GETV1BookmarkResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크를 불러오지 못했어요' })
  }
})

export default route
