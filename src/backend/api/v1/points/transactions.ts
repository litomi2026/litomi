import { and, desc, eq, lt } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import { pointTransactionTable } from '@/database/supabase/points'

export type GETV1PointTransactionResponse = {
  items: Transaction[]
  nextCursor: number | null
}

export type Transaction = {
  id: number
  type: 'earn' | 'spend'
  amount: number
  balanceAfter: number
  description: string | null
  createdAt: string
}

const route = new Hono<Env>()

const PER_PAGE = 20

const querySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
})

route.get('/', requireAuth, requireAdult, zProblemValidator('query', querySchema), async (c) => {
  const userId = c.get('userId')!

  const { cursor } = c.req.valid('query')

  const whereConditions = cursor
    ? and(eq(pointTransactionTable.userId, userId), lt(pointTransactionTable.id, cursor))
    : eq(pointTransactionTable.userId, userId)

  try {
    const transactions = await db
      .select({
        id: pointTransactionTable.id,
        type: pointTransactionTable.type,
        amount: pointTransactionTable.amount,
        balanceAfter: pointTransactionTable.balanceAfter,
        description: pointTransactionTable.description,
        createdAt: pointTransactionTable.createdAt,
      })
      .from(pointTransactionTable)
      .where(whereConditions)
      .orderBy(desc(pointTransactionTable.id))
      .limit(PER_PAGE + 1)

    const hasMore = transactions.length > PER_PAGE

    if (hasMore) {
      transactions.pop()
    }

    const items: Transaction[] = transactions.map((t) => ({
      id: t.id,
      type: t.amount > 0 ? 'earn' : 'spend',
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }))

    const response = {
      items,
      nextCursor: hasMore ? transactions[transactions.length - 1].id : null,
    }
    return c.json<GETV1PointTransactionResponse>(response, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '거래 내역을 불러오지 못했어요' })
  }
})

export default route
