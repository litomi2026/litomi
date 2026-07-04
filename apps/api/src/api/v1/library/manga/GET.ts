import { type GETV1LibraryMangaResponse, getV1LibraryMangaQuerySchema, type LibraryMangaItem } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryItemTable, libraryTable } from '@litomi/db/app/library'
import { decodeLibraryIdCursor, encodeLibraryIdCursor } from '@litomi/db/cursor'
import { intToHexColor } from '@litomi/domain/utils/color'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { and, desc, eq, lt, or } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { getCatalogMangaMap } from '@/utils/catalog-manga'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const libraryMangaRoutes = new Hono<Env>()

libraryMangaRoutes.get('/', zProblemValidator('query', getV1LibraryMangaQuerySchema), async (c) => {
  const { cursor, limit, locale } = c.req.valid('query')
  const decodedCursor = cursor ? decodeLibraryIdCursor(cursor) : null

  if (cursor && !decodedCursor) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
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
    .where(eq(libraryTable.isPublic, true))
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

    if (rows.length === 0) {
      const cacheControl = createCacheControl({
        public: true,
        maxAge: 3,
        sMaxAge: sec('5 minutes'),
      })

      const result = {
        items: [],
        nextCursor: null,
      } satisfies GETV1LibraryMangaResponse

      return c.json(result, { headers: { 'Cache-Control': cacheControl } })
    }

    const hasNextPage = rows.length > limit
    const pageRows = hasNextPage ? rows.slice(0, limit) : rows
    const lastRow = pageRows[pageRows.length - 1]
    const mangaIds = pageRows.map(({ mangaId }) => mangaId)
    const catalogMangaMap = await getCatalogMangaMap(mangaIds, locale)

    const items: LibraryMangaItem[] = pageRows.map((row) => ({
      mangaId: row.mangaId,
      createdAt: row.createdAt.getTime(),
      manga: catalogMangaMap.get(row.mangaId),
      library: {
        id: row.libraryId,
        name: row.libraryName,
        color: intToHexColor(row.libraryColor),
        icon: row.libraryIcon,
      },
    }))

    const nextCursor =
      hasNextPage && lastRow ? encodeLibraryIdCursor(lastRow.createdAt.getTime(), lastRow.mangaId) : null

    const result = {
      items,
      nextCursor,
    } satisfies GETV1LibraryMangaResponse

    const cacheControl = createCacheControl({
      public: true,
      maxAge: 3,
      sMaxAge: decodedCursor ? sec('1 day') : sec('3 hours'),
      swr: sec('1 day'),
    })

    return c.json(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default libraryMangaRoutes
