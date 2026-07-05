import { type GETV1LibraryResponse, getV1LibraryIdQuerySchema, idParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryItemTable, libraryTable, pinnedLibraryTable } from '@litomi/db/app/library'
import { intToHexColor } from '@litomi/domain/utils/color'
import { createCacheControl } from '@litomi/http/cache-control'
import { sec } from '@litomi/std'
import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { adultVerificationRequiredResponse, shouldBlockAdultGate } from '@/utils/adult-gate'
import { privateCacheControl } from '@/utils/cache-control'
import { authRequiredProblemResponse, problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const routes = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  zProblemValidator('param', idParamSchema),
  zProblemValidator('query', getV1LibraryIdQuerySchema),
)

const sharedCacheControl = createCacheControl({
  public: true,
  maxAge: 3,
  sMaxAge: sec('1 day'),
  swr: sec('10 minutes'),
})

routes.get('/', ...middlewares, async (c) => {
  const { id: libraryId } = c.req.valid('param')
  const { scope } = c.req.valid('query')
  const userId = c.get('userId')

  if (scope === 'me' && !userId) {
    return authRequiredProblemResponse(c)
  }

  try {
    const conditions =
      scope === 'public'
        ? and(eq(libraryTable.id, libraryId), eq(libraryTable.isPublic, true))
        : and(eq(libraryTable.id, libraryId), eq(libraryTable.userId, userId!))

    const [library] = await db
      .select({
        id: libraryTable.id,
        userId: libraryTable.userId,
        name: libraryTable.name,
        description: libraryTable.description,
        color: libraryTable.color,
        icon: libraryTable.icon,
        isPublic: libraryTable.isPublic,
        createdAt: libraryTable.createdAt,
        itemCount: sql<number>`(SELECT COUNT(*) FROM ${libraryItemTable} WHERE ${libraryItemTable.libraryId} = ${libraryTable.id})::int`,
        pinCount: sql<number>`(SELECT COUNT(*) FROM ${pinnedLibraryTable} WHERE ${pinnedLibraryTable.libraryId} = ${libraryTable.id})::int`,
      })
      .from(libraryTable)
      .where(conditions)

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

    const result = {
      id: library.id,
      userId: library.userId,
      name: library.name,
      description: library.description,
      color: intToHexColor(library.color),
      icon: library.icon,
      isPublic: library.isPublic,
      createdAt: library.createdAt.getTime(),
      itemCount: library.itemCount,
      pinCount: library.pinCount,
    } satisfies GETV1LibraryResponse

    const cacheControl = scope === 'public' ? sharedCacheControl : privateCacheControl

    return c.json(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default routes
