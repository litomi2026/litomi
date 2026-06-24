import { type GETV1CensorshipResponse, getV1CensorshipQuerySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userCensorshipTable } from '@litomi/db/app/censorship'
import { encodeCensorshipCursor } from '@litomi/db/cursor'
import { and, desc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.get('/', zProblemValidator('query', getV1CensorshipQuerySchema), async (c) => {
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
