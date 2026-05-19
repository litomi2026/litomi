import { postIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/database/app/drizzle'
import { postTable } from '@litomi/db/database/app/post'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('param', postIdParamSchema), async (c) => {
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
    return problemResponse(c, { status: 500, detail: '글을 삭제하지 못했어요' })
  }
})

export default route
