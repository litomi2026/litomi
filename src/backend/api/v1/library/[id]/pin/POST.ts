import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import { libraryTable, pinnedLibraryTable } from '@/database/supabase/library'
import { userTable } from '@/database/supabase/user'

import { getPinnedLibraryLimit } from './limit'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const routes = new Hono<Env>()

routes.post('/', requireAuth, requireAdult, zProblemValidator('param', paramsSchema), async (c) => {
  const { id: libraryId } = c.req.valid('param')
  const userId = c.get('userId')!

  try {
    const result = await db.transaction(async (tx) => {
      // 1) 유저 락으로 동시성 보장
      await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).for('update')

      const [library] = await tx
        .select({ id: libraryTable.id, userId: libraryTable.userId, isPublic: libraryTable.isPublic })
        .from(libraryTable)
        .where(eq(libraryTable.id, libraryId))

      if (!library) {
        return problemResponse(c, { status: 404, detail: '서재를 찾을 수 없어요' })
      }

      if (library.userId === userId) {
        return problemResponse(c, { status: 400, detail: '본인의 서재는 고정할 수 없어요' })
      }

      if (!library.isPublic) {
        return problemResponse(c, { status: 403, detail: '비공개 서재는 고정할 수 없어요' })
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
          status: 403,
          code: 'libo-expansion-required',
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
    return problemResponse(c, { status: 500, detail: '서재를 고정하지 못했어요' })
  }
})

export default routes
