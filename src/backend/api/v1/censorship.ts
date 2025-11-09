import { zValidator } from '@hono/zod-validator'
import { and, desc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { getUserId } from '@/backend/utils/auth'
import { encodeCensorshipCursor } from '@/common/cursor'
import { CENSORSHIPS_PER_PAGE } from '@/constants/policy'
import { createCacheControl } from '@/crawler/proxy-utils'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { userCensorshipTable } from '@/database/supabase/schema'

const querySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(CENSORSHIPS_PER_PAGE).default(CENSORSHIPS_PER_PAGE),
})

export type CensorshipItem = {
  id: number
  key: CensorshipKey
  value: string
  level: CensorshipLevel
  createdAt: number
}

export type GETV1CensorshipResponse = {
  censorships: CensorshipItem[]
  nextCursor: string | null
}

const censorshipRoutes = new Hono<Env>()

censorshipRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const userId = getUserId()

  if (!userId) {
    throw new HTTPException(401)
  }

  const { cursor, limit } = c.req.valid('query')

  const censorshipRows = await db
    .select({
      id: userCensorshipTable.id,
      key: userCensorshipTable.key,
      value: userCensorshipTable.value,
      level: userCensorshipTable.level,
      createdAt: userCensorshipTable.createdAt,
    })
    .from(userCensorshipTable)
    .where(and(eq(userCensorshipTable.userId, userId), cursor ? lt(userCensorshipTable.id, cursor) : undefined))
    .orderBy(desc(userCensorshipTable.id))
    .limit(limit + 1)

  const cacheControl = createCacheControl({
    private: true,
    maxAge: 3,
  })

  const hasNextPage = limit ? censorshipRows.length > limit : false
  const censorships = hasNextPage ? censorshipRows.slice(0, limit) : censorshipRows
  const lastCensorship = censorships[censorships.length - 1]
  const nextCursor = hasNextPage ? encodeCensorshipCursor(lastCensorship.id) : null

  const result = {
    censorships: censorships.map((row) => ({ ...row, createdAt: row.createdAt.getTime() })),
    nextCursor,
  }

  return c.json<GETV1CensorshipResponse>(result, { headers: { 'Cache-Control': cacheControl } })
})

export default censorshipRoutes
