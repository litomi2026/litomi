import { type DELETEV1CensorshipDeleteResponse, deleteV1CensorshipDeleteBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userCensorshipTable } from '@litomi/db/app/censorship'
import { and, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', deleteV1CensorshipDeleteBodySchema))

route.delete('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { ids } = c.req.valid('json')

  try {
    const deleted = await db
      .delete(userCensorshipTable)
      .where(and(eq(userCensorshipTable.userId, userId), inArray(userCensorshipTable.id, ids)))
      .returning({ id: userCensorshipTable.id })

    return c.json({ ids: deleted.map((r) => r.id) } satisfies DELETEV1CensorshipDeleteResponse)
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'constraint'].some((message) => error.message.includes(message))) {
        return problemResponse(c, { status: 400, detail: '입력을 확인해 주세요' })
      }
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
