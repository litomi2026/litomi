import { db } from '@litomi/db/database/app/drizzle'
import { pointDonationTable } from '@litomi/db/database/app/points'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

const deleteParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

route.delete('/:id', requireAuth, zProblemValidator('param', deleteParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id } = c.req.valid('param')

  try {
    const deleted = await db
      .delete(pointDonationTable)
      .where(and(eq(pointDonationTable.id, id), eq(pointDonationTable.userId, userId)))
      .returning({ id: pointDonationTable.id })

    if (deleted.length === 0) {
      return problemResponse(c, { status: 404, detail: '후원 내역을 찾을 수 없어요' })
    }

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '후원 내역 삭제에 실패했어요' })
  }
})

export default route
