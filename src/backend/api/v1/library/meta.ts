import { and, eq, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/library'
import { intToHexColor } from '@/utils/color'
import { sec } from '@/utils/date'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type GETV1LibraryMetaResponse = {
  id: number
  userId: number
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isPublic: boolean
  itemCount: number
}

const libraryMetaRoutes = new Hono<Env>()

libraryMetaRoutes.get('/', zProblemValidator('param', paramsSchema), async (c) => {
  const { id: libraryId } = c.req.valid('param')
  const userId = c.get('userId')

  try {
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
      .where(
        and(eq(libraryTable.id, libraryId), or(eq(libraryTable.userId, userId ?? 0), eq(libraryTable.isPublic, true))),
      )

    if (!library) {
      return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
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

    const cacheControl = createCacheControl({ private: true, maxAge: sec('3s') })

    return c.json<GETV1LibraryMetaResponse>(result, { headers: { 'Cache-Control': cacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '서재 정보를 불러오지 못했어요' })
  }
})

export default libraryMetaRoutes
