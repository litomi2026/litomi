import { zValidator } from '@hono/zod-validator'
import { and, eq, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { createCacheControl } from '@/crawler/proxy-utils'
import { db } from '@/database/supabase/drizzle'
import { libraryItemTable, libraryTable } from '@/database/supabase/schema'
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

libraryMetaRoutes.get('/', zValidator('param', paramsSchema), async (c) => {
  const { id: libraryId } = c.req.valid('param')
  const userId = getUserId()

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
    throw new HTTPException(404)
  }

  const result: GETV1LibraryMetaResponse = {
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
  return c.json(result, { headers: { 'Cache-Control': cacheControl } })
})

export default libraryMetaRoutes
