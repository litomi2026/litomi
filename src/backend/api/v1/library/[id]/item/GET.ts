import { and, desc, eq, lt, or, SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { decodeLibraryIdCursor, encodeLibraryIdCursor } from '@/common/cursor'
import { LIBRARY_ITEMS_PER_PAGE } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'
import { createCacheControl } from '@/utils/cache-control'
import { sec } from '@/utils/format/date'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARY_ITEMS_PER_PAGE).default(LIBRARY_ITEMS_PER_PAGE),
  scope: z.enum(['public', 'me']),
})

export type GETLibraryItemsResponse = {
  items: { mangaId: number; createdAt: number }[]
  nextCursor: string | null
}

const routes = new Hono<Env>()

const sharedCacheControl = createCacheControl({
  public: true,
  maxAge: 3,
  sMaxAge: sec('1 day'),
  swr: sec('10 minutes'),
})

routes.get('/', zProblemValidator('param', paramsSchema), zProblemValidator('query', querySchema), async (c) => {
  const { id: libraryId } = c.req.valid('param')
  const { cursor, limit, scope } = c.req.valid('query')
  const userId = c.get('userId')
  const cursorData = cursor ? decodeLibraryIdCursor(cursor) : null

  if (scope === 'me' && !userId) {
    return problemResponse(c, { status: 401, detail: '로그인 정보가 없거나 만료됐어요' })
  }

  if (cursor && !cursorData) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
  }

  try {
    const libraryConditions =
      scope === 'public'
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

    // NOTE: 비공개 서재(scope=me)는 KR에서 성인 인증이 필요해요.
    if (scope === 'me' && library.isPublic === false) {
      const country = c.req.header('CF-IPCountry')?.trim().toUpperCase() ?? 'KR'
      const isAdult = c.get('isAdult') === true

      if (country === 'KR' && !isAdult) {
        return problemResponse(c, {
          status: 403,
          code: 'adult-verification-required',
          detail: '성인 인증이 필요해요',
          headers: { 'Cache-Control': privateCacheControl },
        })
      }
    }

    const conditions: (SQL | undefined)[] = [eq(libraryItemTable.libraryId, libraryId)]

    if (cursorData) {
      const { timestamp: cursorTimestamp, mangaId: cursorMangaId } = cursorData

      conditions.push(
        or(
          lt(libraryItemTable.createdAt, new Date(cursorTimestamp)),
          and(eq(libraryItemTable.createdAt, new Date(cursorTimestamp)), lt(libraryItemTable.mangaId, cursorMangaId)),
        ),
      )
    }

    const query = db
      .select({ mangaId: libraryItemTable.mangaId, createdAt: libraryItemTable.createdAt })
      .from(libraryItemTable)
      .where(and(...conditions))
      .orderBy(desc(libraryItemTable.createdAt), desc(libraryItemTable.mangaId))
      .limit(limit + 1)

    const fetchedItems = await query
    const hasNextPage = fetchedItems.length > limit
    const pageItems = hasNextPage ? fetchedItems.slice(0, limit) : fetchedItems

    const items = pageItems.map((item) => ({
      mangaId: item.mangaId,
      createdAt: item.createdAt.getTime(),
    }))

    const lastItem = items[items.length - 1]
    const nextCursor = hasNextPage && lastItem ? encodeLibraryIdCursor(lastItem.createdAt, lastItem.mangaId) : null
    const result = { items, nextCursor }
    const cacheControl = scope === 'public' ? sharedCacheControl : privateCacheControl

    return c.json<GETLibraryItemsResponse>(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재 작품을 불러오지 못했어요' })
  }
})

export default routes
