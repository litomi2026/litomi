import type { POSTV1LibraryHistoryImportBody, POSTV1LibraryHistoryImportResponse } from '@litomi/contracts'

import { postV1LibraryHistoryImportBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { readingHistoryTable } from '@litomi/db/app/activity'
import { readUserSettings } from '@litomi/db/app/query/user-settings'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { requireAdult } from '@/middleware/require-adult'
import { requireAuth } from '@/middleware/require-auth'
import { lockUserRowForUpdate } from '@/utils/lock-user-row'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { enforceHistoryLimit, getUserHistoryLimitInTx } from './shared'

const route = new Hono<Env>()

route.post(
  '/import',
  requireAuth,
  requireAdult,
  zProblemValidator('json', postV1LibraryHistoryImportBodySchema),
  async (c) => {
    const userId = c.get('userId')!
    const { localHistories } = c.req.valid('json')

    try {
      const settings = await readUserSettings(userId)

      if (!settings.historySyncEnabled) {
        return c.json({
          importedCount: 0,
          skippedCount: localHistories.length,
          synced: false,
        } satisfies POSTV1LibraryHistoryImportResponse)
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

      return c.json({
        importedCount,
        skippedCount: localHistories.length - importedCount,
        synced: true,
      } satisfies POSTV1LibraryHistoryImportResponse)
    } catch (error) {
      console.error(error)
      return problemResponse(c, { status: 500, detail: '읽기 기록 동기화 중 오류가 발생했어요' })
    }
  },
)

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
