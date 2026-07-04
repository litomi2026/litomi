import { type POSTV1BookmarkResponse, postV1BookmarkBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { problemCode } from '@litomi/http/problem-details'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { BookmarkLimitReachedError, saveBookmarks } from './save'

const route = new Hono<Env>()

route.post('/', requireAuth, requireAdult, zProblemValidator('json', postV1BookmarkBodySchema), async (c) => {
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
      return problemResponse(c, {
        status: 403,
        code: problemCode.LIBO_EXPANSION_REQUIRED,
        title: '북마크 저장 한도에 도달했어요',
      })
    }

    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
