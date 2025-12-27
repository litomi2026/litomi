import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, lt, or, SQL } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { decodeLibraryIdCursor, encodeLibraryIdCursor } from '@/common/cursor'
import { LIBRARY_ITEMS_PER_PAGE } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const querySchema = z.object({
  cursor: z.string().optional(),
})

export type GETLibraryItemsResponse = {
  items: { mangaId: number; createdAt: number }[]
  nextCursor: string | null
}

const itemsRoutes = new Hono<Env>()

itemsRoutes.get('/', zValidator('param', paramsSchema), zValidator('query', querySchema), async (c) => {
  const { id: libraryId } = c.req.valid('param')
  const { cursor } = c.req.valid('query')
  const userId = getUserId()
  const cursorData = cursor ? decodeLibraryIdCursor(cursor) : null

  if (cursor && !cursorData) {
    throw new HTTPException(400)
  }

  const [library] = await db
    .select({
      id: libraryTable.id,
      userId: libraryTable.userId,
      isPublic: libraryTable.isPublic,
    })
    .from(libraryTable)
    .where(
      and(eq(libraryTable.id, libraryId), or(eq(libraryTable.userId, userId ?? 0), eq(libraryTable.isPublic, true))),
    )

  if (!library) {
    throw new HTTPException(404)
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
    .limit(LIBRARY_ITEMS_PER_PAGE + 1)

  const fetchedItems = await query
  const hasNextPage = fetchedItems.length > LIBRARY_ITEMS_PER_PAGE
  const pageItems = fetchedItems.slice(0, LIBRARY_ITEMS_PER_PAGE)

  const items = pageItems.map((item) => ({
    mangaId: item.mangaId,
    createdAt: item.createdAt.getTime(),
  }))

  const lastItem = items[items.length - 1]
  const nextCursor = hasNextPage && lastItem ? encodeLibraryIdCursor(lastItem.createdAt, lastItem.mangaId) : null

  const result: GETLibraryItemsResponse = {
    items,
    nextCursor,
  }

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 3,
  })

  return c.json<GETLibraryItemsResponse>(result, { headers: { 'Cache-Control': cacheControl } })
})

export default itemsRoutes
