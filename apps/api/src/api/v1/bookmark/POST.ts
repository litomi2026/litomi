import { postV1BookmarkBodySchema, type POSTV1BookmarkResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/adult'
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

    return c.json<POSTV1BookmarkResponse>(result)
  } catch (error) {
    if (error instanceof BookmarkLimitReachedError) {
      return problemResponse(c, {
        status: 403,
        code: 'libo-expansion-required',
        detail: '북마크 저장 한도에 도달했어요',
      })
    }

    console.error(error)
    return problemResponse(c, { status: 500, detail: '북마크 저장에 실패했어요' })
  }
})

export default route
