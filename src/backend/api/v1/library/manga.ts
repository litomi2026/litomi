import { and, desc, eq, lt, or } from 'drizzle-orm'
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
import { intToHexColor } from '@/utils/color'
import { sec } from '@/utils/format/date'

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARY_ITEMS_PER_PAGE).default(LIBRARY_ITEMS_PER_PAGE),
  scope: z.enum(['public', 'me']),
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

libraryMangaRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
  const { cursor, limit, scope } = c.req.valid('query')
  const userId = c.get('userId')

  if (scope === 'me') {
    if (!userId) {
      return problemResponse(c, { status: 401, detail: '로그인 정보가 없거나 만료됐어요' })
    }
  }

  const decodedCursor = cursor ? decodeLibraryIdCursor(cursor) : null

  if (cursor && !decodedCursor) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
  }

  const baseConditions = []

  if (scope === 'me') {
    baseConditions.push(eq(libraryTable.userId, userId!))
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

  try {
    const rows = await query

    const sharedCacheControl = createCacheControl({
      public: true,
      maxAge: 3,
      sMaxAge: sec('1 day'),
      swr: sec('1 hour'),
    })

    const cacheControl = scope === 'public' ? sharedCacheControl : privateCacheControl

    if (rows.length === 0) {
      const result = { items: [], nextCursor: null }
      return c.json<GETV1LibraryMangaResponse>(result, { headers: { 'Cache-Control': cacheControl } })
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

    const nextCursor =
      hasNextPage && lastRow ? encodeLibraryIdCursor(lastRow.createdAt.getTime(), lastRow.mangaId) : null

    const result = { items, nextCursor }

    return c.json<GETV1LibraryMangaResponse>(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재 작품 목록을 불러오지 못했어요' })
  }
})

export default libraryMangaRoutes
