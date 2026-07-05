import { type DELETEV1MeTrustedBrowserResponse, idParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { trustedBrowserTable } from '@litomi/db/app/two-factor'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('param', idParamSchema))

route.delete('/', ...middlewares, async (c) => {
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

    return c.json({ id: deleted.id } satisfies DELETEV1MeTrustedBrowserResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
