import { bookmarkMangaIdParamSchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { bookmarkTable } from '@litomi/db/app/activity'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', requireAuth, zProblemValidator('param', bookmarkMangaIdParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id: mangaId } = c.req.valid('param')

  try {
    await db.transaction(async (tx) => {
      // Use the same per-user lock as PUT so concurrent bookmark writes stay ordered.
      await lockUserRowForUpdate(tx, userId)

      await tx.delete(bookmarkTable).where(and(eq(bookmarkTable.userId, userId), eq(bookmarkTable.mangaId, mangaId)))
    })

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 삭제에 실패했어요' })
  }
})

export default route
