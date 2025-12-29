import { and, desc, eq, lt, ne, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { decodeLibraryListCursor, encodeLibraryListCursor } from '@/common/cursor'
import { LIBRARIES_PER_PAGE } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'
import { intToHexColor } from '@/utils/color'
import { sec } from '@/utils/date'

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(LIBRARIES_PER_PAGE).default(LIBRARIES_PER_PAGE),
})

export type GETV1LibraryListResponse = {
  libraries: LibraryListItem[]
  nextCursor: string | null
}

export type LibraryListItem = {
  id: number
  userId: number
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isPublic: boolean
  createdAt: number
  itemCount: number
}

const libraryListRoutes = new Hono<Env>()

libraryListRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')
  const { cursor, limit } = c.req.valid('query')

  const decodedCursor = cursor ? decodeLibraryListCursor(cursor) : null

  if (cursor && !decodedCursor) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
  }

  const itemCountExpr = sql<number>`
    (SELECT COUNT(*) FROM ${libraryItemTable} WHERE ${libraryItemTable.libraryId} = ${libraryTable.id})::int
  `

  const conditions = []

  if (userId) {
    conditions.push(or(eq(libraryTable.userId, userId), eq(libraryTable.isPublic, true)))
  } else {
    conditions.push(eq(libraryTable.isPublic, true))
  }

  if (decodedCursor) {
    const { isOwner: cursorIsOwner, itemCount: cursorItemCount, timestamp, id: cursorId } = decodedCursor
    const cursorCreatedAt = new Date(timestamp)

    const withinGroup = or(
      lt(itemCountExpr, cursorItemCount),
      and(eq(itemCountExpr, cursorItemCount), lt(libraryTable.createdAt, cursorCreatedAt)),
      and(
        eq(itemCountExpr, cursorItemCount),
        eq(libraryTable.createdAt, cursorCreatedAt),
        lt(libraryTable.id, cursorId),
      ),
    )

    if (userId) {
      if (cursorIsOwner === 1) {
        conditions.push(
          or(
            and(eq(libraryTable.userId, userId), withinGroup),
            and(eq(libraryTable.isPublic, true), ne(libraryTable.userId, userId)),
          ),
        )
      } else {
        conditions.push(and(and(eq(libraryTable.isPublic, true), ne(libraryTable.userId, userId)), withinGroup))
      }
    } else {
      conditions.push(withinGroup)
    }
  }

  let query = db
    .select({
      id: libraryTable.id,
      userId: libraryTable.userId,
      name: libraryTable.name,
      description: libraryTable.description,
      color: libraryTable.color,
      icon: libraryTable.icon,
      isPublic: libraryTable.isPublic,
      createdAt: libraryTable.createdAt,
      itemCount: itemCountExpr,
    })
    .from(libraryTable)
    .where(and(...conditions))
    .limit(limit + 1)
    .$dynamic()

  if (userId) {
    query = query.orderBy(
      desc(eq(libraryTable.userId, userId)),
      desc(itemCountExpr),
      desc(libraryTable.createdAt),
      desc(libraryTable.id),
    )
  } else {
    query = query.orderBy(desc(itemCountExpr), desc(libraryTable.createdAt), desc(libraryTable.id))
  }

  try {
    const rows = await query

    const cacheControl = createCacheControl({
      private: true,
      maxAge: cursor ? sec('1 minute') : sec('3s'),
    })

    if (rows.length === 0) {
      const result: GETV1LibraryListResponse = { libraries: [], nextCursor: null }
      return c.json(result, { headers: { 'Cache-Control': cacheControl } })
    }

    const hasNextPage = rows.length > limit
    const pageRows = hasNextPage ? rows.slice(0, limit) : rows
    const lastRow = pageRows[pageRows.length - 1]

    const libraries: LibraryListItem[] = pageRows.map((row) => ({
      id: row.id,
      userId: row.userId,
      name: row.name,
      description: row.description,
      color: intToHexColor(row.color),
      icon: row.icon,
      isPublic: row.isPublic,
      createdAt: row.createdAt.getTime(),
      itemCount: row.itemCount,
    }))

    const nextCursor =
      hasNextPage && lastRow
        ? encodeLibraryListCursor(
            userId && lastRow.userId === userId ? 1 : 0,
            lastRow.itemCount,
            lastRow.createdAt.getTime(),
            lastRow.id,
          )
        : null

    const result = { libraries, nextCursor }

    return c.json<GETV1LibraryListResponse>(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재 목록을 불러오지 못했어요' })
  }
})

export default libraryListRoutes
