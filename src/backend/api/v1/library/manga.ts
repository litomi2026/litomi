import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, lt, or } from 'drizzle-orm'
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
import { intToHexColor } from '@/utils/color'
import { sec } from '@/utils/date'

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARY_ITEMS_PER_PAGE).default(LIBRARY_ITEMS_PER_PAGE),
})

export type GETV1LibraryMangaResponse = {
  items: LibraryMangaItem[]
  nextCursor: string | null
}

export type LibraryMangaItem = {
  mangaId: number
  createdAt: number
  library: {
    id: number
    name: string
    color: string | null
    icon: string | null
  }
}

const libraryMangaRoutes = new Hono<Env>()

libraryMangaRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const userId = getUserId()
  const { cursor, limit } = c.req.valid('query')

  const decodedCursor = cursor ? decodeLibraryIdCursor(cursor) : null

  if (cursor && !decodedCursor) {
    throw new HTTPException(400)
  }

  const baseConditions = []

  if (userId) {
    baseConditions.push(eq(libraryTable.userId, userId))
  } else {
    baseConditions.push(eq(libraryTable.isPublic, true))
  }

  const perManga = db
    .selectDistinctOn([libraryItemTable.mangaId], {
      mangaId: libraryItemTable.mangaId,
      createdAt: libraryItemTable.createdAt,
      libraryId: libraryItemTable.libraryId,
      libraryName: libraryTable.name,
      libraryColor: libraryTable.color,
      libraryIcon: libraryTable.icon,
    })
    .from(libraryItemTable)
    .innerJoin(libraryTable, eq(libraryItemTable.libraryId, libraryTable.id))
    .where(and(...baseConditions))
    .orderBy(libraryItemTable.mangaId, desc(libraryItemTable.createdAt), desc(libraryItemTable.libraryId))
    .as('per_manga')

  const conditions = []

  if (decodedCursor) {
    const { timestamp, mangaId } = decodedCursor

    conditions.push(
      or(
        lt(perManga.createdAt, new Date(timestamp)),
        and(eq(perManga.createdAt, new Date(timestamp)), lt(perManga.mangaId, mangaId)),
      ),
    )
  }

  let query = db
    .select({
      mangaId: perManga.mangaId,
      createdAt: perManga.createdAt,
      libraryId: perManga.libraryId,
      libraryName: perManga.libraryName,
      libraryColor: perManga.libraryColor,
      libraryIcon: perManga.libraryIcon,
    })
    .from(perManga)
    .limit(limit + 1)
    .$dynamic()

  if (conditions.length > 0) {
    query = query.where(and(...conditions))
  }

  query = query.orderBy(desc(perManga.createdAt), desc(perManga.mangaId))
  const rows = await query

  const cacheControl = createCacheControl({
    private: true,
    maxAge: cursor ? sec('1 minute') : 3,
  })

  if (rows.length === 0) {
    const result: GETV1LibraryMangaResponse = { items: [], nextCursor: null }
    return c.json(result, { headers: { 'Cache-Control': cacheControl } })
  }

  const hasNextPage = rows.length > limit
  const pageRows = hasNextPage ? rows.slice(0, limit) : rows
  const lastRow = pageRows[pageRows.length - 1]

  const items: LibraryMangaItem[] = pageRows.map((row) => ({
    mangaId: row.mangaId,
    createdAt: row.createdAt.getTime(),
    library: {
      id: row.libraryId,
      name: row.libraryName,
      color: intToHexColor(row.libraryColor),
      icon: row.libraryIcon,
    },
  }))

  const nextCursor = hasNextPage && lastRow ? encodeLibraryIdCursor(lastRow.createdAt.getTime(), lastRow.mangaId) : null

  const result: GETV1LibraryMangaResponse = { items, nextCursor }
  return c.json(result, { headers: { 'Cache-Control': cacheControl } })
})

export default libraryMangaRoutes
