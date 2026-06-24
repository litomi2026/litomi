import { type GETLibraryItemsResponse, getLibraryItemsQuerySchema, libraryIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryTable } from '@litomi/db/app/library'
import { decodeLibraryIdCursor } from '@litomi/db/cursor'
import { selectLibraryItem } from '@litomi/db/query/library-item'
import { getNextLibraryItemCursor } from '@litomi/db/sql/library-item-sort'
import { DEFAULT_LIBRARY_ITEM_SORT } from '@litomi/domain/library/sort'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { adultVerificationRequiredResponse, shouldBlockAdultGate } from '@/utils/adult-gate'
import { privateCacheControl } from '@/utils/cache-control'
import { getCatalogMangaMap } from '@/utils/catalog-manga'
import { authRequiredProblemResponse, problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const routes = new Hono<Env>()

const sharedCacheControl = createCacheControl({
  public: true,
  maxAge: 3,
  sMaxAge: sec('1 day'),
  swr: sec('10 minutes'),
})

routes.get(
  '/',
  zProblemValidator('param', libraryIdParamSchema),
  zProblemValidator('query', getLibraryItemsQuerySchema),
  async (c) => {
    const { id: libraryId } = c.req.valid('param')
    const { cursor, limit, locale, scope, sort } = c.req.valid('query')
    const userId = c.get('userId')
    const cursorData = cursor ? decodeLibraryIdCursor(cursor) : null
    const isPublicScope = scope === 'public'

    if (scope === 'me' && !userId) {
      return authRequiredProblemResponse(c)
    }

    if (cursor && !cursorData) {
      return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
    }

    try {
      const libraryConditions = isPublicScope
        ? and(eq(libraryTable.id, libraryId), eq(libraryTable.isPublic, true))
        : and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId!))

      const [library] = await db
        .select({ id: libraryTable.id, isPublic: libraryTable.isPublic })
        .from(libraryTable)
        .where(libraryConditions)

      if (!library) {
        return problemResponse(c, {
          status: 404,
          detail: '서재를 찾을 수 없어요',
          headers: { 'Cache-Control': privateCacheControl },
        })
      }

      if (scope === 'me' && library.isPublic === false && shouldBlockAdultGate(c)) {
        return adultVerificationRequiredResponse(c)
      }

      const fetchedItems = await selectLibraryItem({
        libraryId,
        limit: limit + 1,
        sort: isPublicScope ? DEFAULT_LIBRARY_ITEM_SORT : sort,
        ...(cursorData && {
          cursorMangaId: cursorData.mangaId,
          cursorTime: new Date(cursorData.timestamp),
        }),
      })

      const hasNextPage = fetchedItems.length > limit
      const pageItems = hasNextPage ? fetchedItems.slice(0, limit) : fetchedItems
      const mangaIds = pageItems.map(({ mangaId }) => mangaId)
      const catalogMangaMap = await getCatalogMangaMap(mangaIds, locale)

      const items = pageItems.map((item) => ({
        mangaId: item.mangaId,
        createdAt: item.createdAt.getTime(),
        manga: catalogMangaMap.get(item.mangaId),
      }))

      const lastItem = items[items.length - 1]
      const nextCursor = hasNextPage && lastItem ? getNextLibraryItemCursor(pageItems[pageItems.length - 1]) : null
      const result = { items, nextCursor }
      const cacheControl = isPublicScope ? sharedCacheControl : privateCacheControl

      return c.json<GETLibraryItemsResponse>(result, { headers: { 'Cache-Control': cacheControl } })
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500, detail: '서재 작품을 불러오지 못했어요' })
    }
  },
)

export default routes
