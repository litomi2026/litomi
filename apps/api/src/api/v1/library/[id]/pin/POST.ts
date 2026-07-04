import { idParamSchema, PROBLEM } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { libraryTable, pinnedLibraryTable } from '@litomi/db/app/library'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { getPinnedLibraryLimit } from './limit'

const routes = new Hono<Env>()

routes.post('/', requireAuth, requireAdult, zProblemValidator('param', idParamSchema), async (c) => {
  const { id: libraryId } = c.req.valid('param')
  const userId = c.get('userId')!

  try {
    const result = await db.transaction(async (tx) => {
      // 1) 유저 락으로 동시성 보장
      await lockUserRowForUpdate(tx, userId)

      const [library] = await tx
        .select({ id: libraryTable.id, userId: libraryTable.userId, isPublic: libraryTable.isPublic })
        .from(libraryTable)
        .where(eq(libraryTable.id, libraryId))

      if (!library) {
        return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
      }

      if (library.userId === userId) {
        return problemResponse(c, { problem: PROBLEM.OWN_LIBRARY_PIN })
      }

      if (!library.isPublic) {
        return problemResponse(c, { problem: PROBLEM.PRIVATE_LIBRARY_PIN })
      }

      // 2) 기등록 여부 조회 및 개수 제한 고려
      const pinnedList = await tx
        .select({ libraryId: pinnedLibraryTable.libraryId })
        .from(pinnedLibraryTable)
        .where(eq(pinnedLibraryTable.userId, userId))

      if (pinnedList.some((p) => p.libraryId === libraryId)) {
        return c.json({ result: 'ok' })
      }

      // 3) 한도 계산
      const limit = await getPinnedLibraryLimit(tx, userId)

      if (pinnedList.length >= limit) {
        return problemResponse(c, {
          problem: PROBLEM.LIBO_EXPANSION_REQUIRED,
          detail: `현재 ${limit}개까지만 추가할 수 있어요`,
        })
      }

      // 4) 추가
      await tx.insert(pinnedLibraryTable).values({ userId, libraryId })

      return c.json({ result: 'ok' })
    })

    return result
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default routes
