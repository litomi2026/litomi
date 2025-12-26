import { eq, sum } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { Env } from '@/backend'
import { EXPANSION_TYPE, POINT_CONSTANTS } from '@/constants/points'
import { MAX_BOOKMARKS_PER_USER, MAX_LIBRARIES_PER_USER, MAX_READING_HISTORY_PER_USER } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { userExpansionTable } from '@/database/supabase/points-schema'

export type ExpansionInfo = {
  base: number
  extra: number
  current: number
  max: number
  canExpand: boolean
  price: number
  unit: number
}

export type GETV1PointExpansionResponse = {
  library: ExpansionInfo
  history: ExpansionInfo
  bookmark: ExpansionInfo
}

const route = new Hono<Env>()

route.get('/', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    throw new HTTPException(401)
  }

  const expansions = await db
    .select({
      type: userExpansionTable.type,
      totalAmount: sum(userExpansionTable.amount),
    })
    .from(userExpansionTable)
    .where(eq(userExpansionTable.userId, userId))
    .groupBy(userExpansionTable.type)

  const libraryExpansion = expansions.find((e) => e.type === EXPANSION_TYPE.LIBRARY)
  const historyExpansion = expansions.find((e) => e.type === EXPANSION_TYPE.READING_HISTORY)
  const bookmarkExpansion = expansions.find((e) => e.type === EXPANSION_TYPE.BOOKMARK)
  const libraryExtra = Number(libraryExpansion?.totalAmount ?? 0)
  const historyExtra = Number(historyExpansion?.totalAmount ?? 0)
  const bookmarkExtra = Number(bookmarkExpansion?.totalAmount ?? 0)

  const response = {
    library: {
      base: MAX_LIBRARIES_PER_USER,
      extra: libraryExtra,
      current: MAX_LIBRARIES_PER_USER + libraryExtra,
      max: POINT_CONSTANTS.LIBRARY_MAX_EXPANSION,
      canExpand: MAX_LIBRARIES_PER_USER + libraryExtra < POINT_CONSTANTS.LIBRARY_MAX_EXPANSION,
      price: POINT_CONSTANTS.LIBRARY_EXPANSION_PRICE,
      unit: POINT_CONSTANTS.LIBRARY_EXPANSION_AMOUNT,
    },
    history: {
      base: MAX_READING_HISTORY_PER_USER,
      extra: historyExtra,
      current: MAX_READING_HISTORY_PER_USER + historyExtra,
      max: POINT_CONSTANTS.HISTORY_MAX_EXPANSION,
      canExpand: MAX_READING_HISTORY_PER_USER + historyExtra < POINT_CONSTANTS.HISTORY_MAX_EXPANSION,
      price: POINT_CONSTANTS.HISTORY_EXPANSION_PRICE,
      unit: POINT_CONSTANTS.HISTORY_EXPANSION_AMOUNT,
    },
    bookmark: {
      base: MAX_BOOKMARKS_PER_USER,
      extra: bookmarkExtra,
      current: MAX_BOOKMARKS_PER_USER + bookmarkExtra,
      max: POINT_CONSTANTS.BOOKMARK_MAX_EXPANSION,
      canExpand: MAX_BOOKMARKS_PER_USER + bookmarkExtra < POINT_CONSTANTS.BOOKMARK_MAX_EXPANSION,
      price: POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_PRICE,
      unit: POINT_CONSTANTS.BOOKMARK_EXPANSION_SMALL_AMOUNT,
    },
  }

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 3,
  })

  return c.json<GETV1PointExpansionResponse>(response, { headers: { 'Cache-Control': cacheControl } })
})

export default route
