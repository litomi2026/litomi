import {
  getV1LibraryListQuerySchema,
  type GETV1LibraryListResponse,
  type LibraryListItem,
} from '@litomi/contracts'
import { db } from '@litomi/db/database/app/drizzle'
import { libraryItemTable, libraryTable, pinnedLibraryTable } from '@litomi/db/database/app/library'
import { decodeLibraryListCursor, encodeLibraryListCursor } from '@litomi/domain/common/cursor'
import { intToHexColor } from '@litomi/domain/utils/color'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { and, desc, eq, lt, ne, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const libraryListRoutes = new Hono<Env>()

libraryListRoutes.get('/', zProblemValidator('query', getV1LibraryListQuerySchema), async (c) => {
  const { cursor, limit, scope: listScope } = c.req.valid('query')
  const userId = c.get('userId')

  if (listScope === 'me' || listScope === 'pinned') {
    if (!userId) {
      return problemResponse(c, { status: 401, detail: '로그인 정보가 없거나 만료됐어요' })
    }
  }

  const decodedCursor = cursor ? decodeLibraryListCursor(cursor) : null

  if (cursor && !decodedCursor) {
    return problemResponse(c, { status: 400, detail: '잘못된 커서예요' })
  }

  const itemCountExpr = sql<number>`
    (SELECT COUNT(*) FROM ${libraryItemTable} WHERE ${libraryItemTable.libraryId} = ${libraryTable.id})::int
  `
  const pinnedCountExpr = sql<number>`
    (SELECT COUNT(*) FROM ${pinnedLibraryTable} WHERE ${pinnedLibraryTable.libraryId} = ${libraryTable.id})::int
  `
  const sortCountExpr =
    listScope === 'public'
      ? pinnedCountExpr
      : listScope === 'all' && userId
        ? sql<number>`CASE WHEN ${libraryTable.userId} = ${userId} THEN ${itemCountExpr} ELSE ${pinnedCountExpr} END`
        : itemCountExpr

  const conditions = []

  if (listScope === 'me') {
    conditions.push(eq(libraryTable.userId, userId!))
  } else if (listScope === 'pinned') {
    conditions.push(eq(pinnedLibraryTable.userId, userId!))
  } else if (listScope === 'public') {
    conditions.push(eq(libraryTable.isPublic, true))
  } else if (userId) {
    conditions.push(or(eq(libraryTable.userId, userId), eq(libraryTable.isPublic, true)))
  } else {
    conditions.push(eq(libraryTable.isPublic, true))
  }

  if (decodedCursor) {
    const {
      isOwner: cursorIsOwner,
      sortCount: cursorSortCount,
      itemCount: cursorItemCount,
      timestamp,
      id: cursorId,
    } = decodedCursor
    const cursorCreatedAt = new Date(timestamp)

    const withinGroup = or(
      lt(sortCountExpr, cursorSortCount),
      and(eq(sortCountExpr, cursorSortCount), lt(itemCountExpr, cursorItemCount)),
      and(
        eq(sortCountExpr, cursorSortCount),
        eq(itemCountExpr, cursorItemCount),
        lt(libraryTable.createdAt, cursorCreatedAt),
      ),
      and(
        eq(sortCountExpr, cursorSortCount),
        eq(itemCountExpr, cursorItemCount),
        eq(libraryTable.createdAt, cursorCreatedAt),
        lt(libraryTable.id, cursorId),
      ),
    )

    if (listScope === 'all' && userId) {
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
      sortCount: sortCountExpr,
    })
    .from(libraryTable)
    .$dynamic()

  if (listScope === 'pinned') {
    query = query.innerJoin(pinnedLibraryTable, eq(pinnedLibraryTable.libraryId, libraryTable.id))
  }

  query = query.where(and(...conditions)).limit(limit + 1)

  if (listScope === 'all' && userId) {
    query = query.orderBy(
      desc(eq(libraryTable.userId, userId)),
      desc(sortCountExpr),
      desc(itemCountExpr),
      desc(libraryTable.createdAt),
      desc(libraryTable.id),
    )
  } else {
    query = query.orderBy(desc(sortCountExpr), desc(itemCountExpr), desc(libraryTable.createdAt), desc(libraryTable.id))
  }

  try {
    const rows = await query

    const sharedCacheControl = createCacheControl({
      public: true,
      maxAge: 3,
      sMaxAge: sec('6 hours'),
      swr: sec('10 minutes'),
    })

    const cacheControl = listScope === 'public' ? sharedCacheControl : privateCacheControl

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

    const isOwnerFlag = listScope === 'public' ? 0 : userId && lastRow.userId === userId ? 1 : 0

    const nextCursor =
      hasNextPage && lastRow
        ? encodeLibraryListCursor(
            isOwnerFlag,
            lastRow.sortCount,
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
