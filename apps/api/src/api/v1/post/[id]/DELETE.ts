import { idParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { postTable } from '@litomi/db/app/post'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', idParamSchema))

route.delete('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { id: postId } = c.req.valid('param')

  try {
    const deleted = await db
      .delete(postTable)
      .where(and(eq(postTable.userId, userId), eq(postTable.id, postId)))
      .returning({ id: postTable.id })

    if (deleted.length === 0) {
      return problemResponse(c, { status: 404, detail: '글을 찾을 수 없어요' })
    }

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
