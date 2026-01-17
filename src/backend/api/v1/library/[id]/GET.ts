import { and, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'
import { createCacheControl } from '@/utils/cache-control'
import { intToHexColor } from '@/utils/color'
import { sec } from '@/utils/format/date'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const metaQuerySchema = z.object({
  scope: z.enum(['public', 'me']),
})

export type GETV1LibraryResponse = {
  id: number
  userId: number
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isPublic: boolean
  itemCount: number
}

const routes = new Hono<Env>()

const sharedCacheControl = createCacheControl({
  public: true,
  maxAge: 3,
  sMaxAge: sec('1 day'),
  swr: sec('10 minutes'),
})

routes.get('/', zProblemValidator('param', paramsSchema), zProblemValidator('query', metaQuerySchema), async (c) => {
  const { id: libraryId } = c.req.valid('param')
  const { scope } = c.req.valid('query')
  const userId = c.get('userId')

  if (scope === 'me' && !userId) {
    return problemResponse(c, { status: 401, detail: '로그인 정보가 없거나 만료됐어요' })
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
        itemCount: sql<number>`(SELECT COUNT(*) FROM ${libraryItemTable} WHERE ${libraryItemTable.libraryId} = ${libraryTable.id})::int`,
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

    const result = {
      id: library.id,
      userId: library.userId,
      name: library.name,
      description: library.description,
      color: intToHexColor(library.color),
      icon: library.icon,
      isPublic: library.isPublic,
      itemCount: library.itemCount,
    }

    const cacheControl = scope === 'public' ? sharedCacheControl : privateCacheControl

    return c.json<GETV1LibraryResponse>(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재 정보를 불러오지 못했어요' })
  }
})

export default routes
