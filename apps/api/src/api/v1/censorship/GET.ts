import { userCensorshipTable } from '@litomi/db/database/supabase/censorship'
import { db } from '@litomi/db/database/supabase/drizzle'
import 'server-only'
import { encodeCensorshipCursor } from '@litomi/domain/common/cursor'
import { CENSORSHIPS_PER_PAGE } from '@litomi/domain/constants/policy'
import { CensorshipKey, CensorshipLevel } from '@litomi/domain/database/enum'
import { and, desc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

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

const route = new Hono<Env>()

route.get('/', zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')!
  const { cursor, limit } = c.req.valid('query')

  try {
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

    const hasNextPage = limit ? censorshipRows.length > limit : false
    const censorships = hasNextPage ? censorshipRows.slice(0, limit) : censorshipRows
    const lastCensorship = censorships[censorships.length - 1]
    const nextCursor = hasNextPage ? encodeCensorshipCursor(lastCensorship.id) : null

    const result = {
      censorships: censorships.map((row) => ({ ...row, createdAt: row.createdAt.getTime() })),
      nextCursor,
    }

    return c.json<GETV1CensorshipResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '검열 설정을 불러오지 못했어요' })
  }
})

export default route
