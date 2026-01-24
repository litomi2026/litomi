import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import { pointDonationTable } from '@/database/supabase/points'

const route = new Hono<Env>()

const deleteParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

route.delete('/:id', requireAuth, zProblemValidator('param', deleteParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id } = c.req.valid('param')

  try {
    const [donation] = await db
      .select({ id: pointDonationTable.id, deletedAt: pointDonationTable.deletedAt })
      .from(pointDonationTable)
      .where(and(eq(pointDonationTable.id, id), eq(pointDonationTable.userId, userId)))

    if (!donation) {
      return problemResponse(c, { status: 404, detail: '기부 내역을 찾을 수 없어요' })
    }

    if (donation.deletedAt) {
      return c.body(null, 204)
    }

    await db
      .update(pointDonationTable)
      .set({ deletedAt: new Date() })
      .where(and(eq(pointDonationTable.id, id), eq(pointDonationTable.userId, userId)))

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '기부 내역 삭제에 실패했어요' })
  }
})

export default route
