import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { lockUserRowForUpdate } from '@/backend/utils/lock-user-row'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { MAX_MANGA_ID } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'

import { BookmarkLimitReachedError, saveBookmarks } from './save'

const postBodySchema = z.object({
  mangaIds: z.array(z.coerce.number().int().positive().max(MAX_MANGA_ID)).min(1).max(100),
})

export type POSTV1BookmarkBody = z.infer<typeof postBodySchema>

export type POSTV1BookmarkResponse = {
  createdMangaIds: number[]
  duplicateCount: number
  overflowCount: number
}

const route = new Hono<Env>()

route.post('/', requireAuth, zProblemValidator('json', postBodySchema), async (c) => {
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
