import { and, desc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { encodeCensorshipCursor } from '@/common/cursor'
import { CENSORSHIPS_PER_PAGE } from '@/constants/policy'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'
import { userCensorshipTable } from '@/database/supabase/censorship'
import { db } from '@/database/supabase/drizzle'
import { createCacheControl } from '@/utils/cache-control'

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

censorshipRoutes.get('/', zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401 })
  }

  try {
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
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '검열 설정을 불러오지 못했어요' })
  }
})

export default censorshipRoutes
