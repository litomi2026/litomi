import { type POSTV1BookmarkResponse, PROBLEM, postV1BookmarkBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { BookmarkLimitReachedError, saveBookmarks } from './save'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  requireAdult,
  zProblemValidator('json', postV1BookmarkBodySchema),
)

route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { mangaIds } = c.req.valid('json')

  try {
    const result = await db.transaction(async (tx) => {
      await lockUserRowForUpdate(tx, userId)

      const mangaIdEntries = mangaIds.map((mangaId) => ({ mangaId }))

      return saveBookmarks(tx, userId, mangaIdEntries)
    })

    return c.json(result satisfies POSTV1BookmarkResponse)
  } catch (error) {
    if (error instanceof BookmarkLimitReachedError) {
      return problemResponse(c, { problem: PROBLEM.LIBO_EXPANSION_REQUIRED })
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
