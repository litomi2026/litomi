import { readingHistoryTable } from '@litomi/db/database/supabase/activity'
import { db } from '@litomi/db/database/supabase/drizzle'
import 'server-only'
import { readUserSettings } from '@litomi/db/query/user-settings.query'
import { MAX_MANGA_ID } from '@litomi/domain/constants/policy'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { requireAdult } from '@/backend/middleware/adult'
import { requireAuth } from '@/backend/middleware/require-auth'
import { lockUserRowForUpdate } from '@/backend/utils/lock-user-row'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

import { enforceHistoryLimit, getUserHistoryLimitInTx, MAX_READING_HISTORY_LAST_PAGE } from './shared'

const localHistorySchema = z.object({
  mangaId: z.coerce.number().int().positive().max(MAX_MANGA_ID),
  lastPage: z.coerce.number().int().positive().max(MAX_READING_HISTORY_LAST_PAGE),
  updatedAt: z.coerce.number().int().positive(),
})

const postBodySchema = z.object({
  localHistories: z.array(localHistorySchema).min(1).max(100),
})

export type POSTV1LibraryHistoryImportBody = z.infer<typeof postBodySchema>

export type POSTV1LibraryHistoryImportResponse = {
  importedCount: number
  skippedCount: number
  synced: boolean
}

const route = new Hono<Env>()

route.post('/import', requireAuth, requireAdult, zProblemValidator('json', postBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { localHistories } = c.req.valid('json')

  try {
    const settings = await readUserSettings(userId)

    if (!settings.historySyncEnabled) {
      return c.json<POSTV1LibraryHistoryImportResponse>({
        importedCount: 0,
        skippedCount: localHistories.length,
        synced: false,
      })
    }

    const values = Array.from(getLatestLocalHistories(localHistories).values()).map((item) => ({
      userId,
      mangaId: item.mangaId,
      lastPage: item.lastPage,
      updatedAt: new Date(item.updatedAt),
    }))

    const importedCount = await db.transaction(async (tx) => {
      await lockUserRowForUpdate(tx, userId)

      const inserted = await tx
        .insert(readingHistoryTable)
        .values(values)
        .onConflictDoUpdate({
          target: [readingHistoryTable.userId, readingHistoryTable.mangaId],
          set: {
            lastPage: sql`excluded.${sql.identifier(readingHistoryTable.lastPage.name)}`,
            updatedAt: sql`excluded.${sql.identifier(readingHistoryTable.updatedAt.name)}`,
          },
        })
        .returning({ mangaId: readingHistoryTable.mangaId })

      const userHistoryLimit = await getUserHistoryLimitInTx(tx, userId)
      await enforceHistoryLimit(tx, userId, userHistoryLimit)

      return inserted.length
    })

    return c.json<POSTV1LibraryHistoryImportResponse>({
      importedCount,
      skippedCount: localHistories.length - importedCount,
      synced: true,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '읽기 기록 동기화 중 오류가 발생했어요' })
  }
})

function getLatestLocalHistories(localHistories: POSTV1LibraryHistoryImportBody['localHistories']) {
  const deduped = new Map<number, POSTV1LibraryHistoryImportBody['localHistories'][number]>()

  for (const item of localHistories) {
    const prev = deduped.get(item.mangaId)

    if (
      !prev ||
      item.updatedAt > prev.updatedAt ||
      (item.updatedAt === prev.updatedAt && item.lastPage > prev.lastPage)
    ) {
      deduped.set(item.mangaId, item)
    }
  }

  return deduped
}

export default route
