import { type DELETEV1MeTrustedBrowserResponse, deleteV1MeTrustedBrowserParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { trustedBrowserTable } from '@litomi/db/app/two-factor'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', zProblemValidator('param', deleteV1MeTrustedBrowserParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id } = c.req.valid('param')

  try {
    const [deleted] = await db
      .delete(trustedBrowserTable)
      .where(and(eq(trustedBrowserTable.userId, userId), eq(trustedBrowserTable.id, id)))
      .returning({ id: trustedBrowserTable.id })

    if (!deleted) {
      return problemResponse(c, { status: 404, detail: '브라우저를 찾을 수 없어요' })
    }

    return c.json({
      id: deleted.id,
      message: '브라우저가 제거됐어요',
    } satisfies DELETEV1MeTrustedBrowserResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '브라우저 제거에 실패했어요' })
  }
})

export default route
