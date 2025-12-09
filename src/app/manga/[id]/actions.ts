'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq, sql, sum } from 'drizzle-orm'
import { z } from 'zod'

import { EXPANSION_TYPE, POINT_CONSTANTS } from '@/constants/points'
import { MAX_READING_HISTORY_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { readingHistoryTable, userExpansionTable, userRatingTable } from '@/database/supabase/schema'
import { badRequest, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

type SessionDBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const saveReadingProgressSchema = z.object({
  mangaId: z.number().int().positive(),
  page: z.number().int().positive(),
})

export async function saveReadingProgress(mangaId: number, page: number) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = saveReadingProgressSchema.safeParse({ mangaId, page })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(readingHistoryTable)
        .values({
          userId,
          mangaId,
          lastPage: page,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [readingHistoryTable.userId, readingHistoryTable.mangaId],
          set: {
            lastPage: page,
            updatedAt: new Date(),
          },
        })

      const userHistoryLimit = await getUserHistoryLimitInTx(tx, userId)
      await enforceHistoryLimit(tx, userId, userHistoryLimit)
    })

    return ok(true)
  } catch (error) {
    captureException(error)
    return internalServerError('읽기 기록 저장 중 오류가 발생했어요')
  }
}

async function enforceHistoryLimit(tx: SessionDBTransaction, userId: number, limit: number) {
  await tx.execute(sql`
    DELETE FROM ${readingHistoryTable}
    WHERE ${readingHistoryTable.userId} = ${userId}
      AND (manga_id, updated_at) NOT IN (
        SELECT ${readingHistoryTable.mangaId}, ${readingHistoryTable.updatedAt}
        FROM ${readingHistoryTable}
        WHERE ${readingHistoryTable.userId} = ${userId}
        ORDER BY ${readingHistoryTable.updatedAt} DESC, ${readingHistoryTable.mangaId} DESC
        LIMIT ${limit}
      )
  `)
}

async function getUserHistoryLimitInTx(tx: SessionDBTransaction, userId: number): Promise<number> {
  const [expansion] = await tx
    .select({ totalAmount: sum(userExpansionTable.amount) })
    .from(userExpansionTable)
    .where(and(eq(userExpansionTable.userId, userId), eq(userExpansionTable.type, EXPANSION_TYPE.READING_HISTORY)))

  const extra = Number(expansion?.totalAmount ?? 0)
  return Math.min(MAX_READING_HISTORY_PER_USER + extra, POINT_CONSTANTS.HISTORY_MAX_EXPANSION)
}

const migrateReadingHistorySchema = z.object({
  localHistories: z
    .array(
      z.object({
        mangaId: z.number().int().positive(),
        lastPage: z.number().int().positive(),
        updatedAt: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(100),
})

export type ReadingHistoryItem = {
  mangaId: number
  lastPage: number
  updatedAt: Date
}

export async function migrateReadingHistory(data: ReadingHistoryItem[]) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = migrateReadingHistorySchema.safeParse({ localHistories: data })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { localHistories } = validation.data

  const values = localHistories.map((item) => ({
    userId,
    mangaId: item.mangaId,
    lastPage: item.lastPage,
    updatedAt: new Date(item.updatedAt),
  }))

  try {
    const result = await db.transaction(async (tx) => {
      const result = await tx
        .insert(readingHistoryTable)
        .values(values)
        .onConflictDoNothing()
        .returning({ mangaId: readingHistoryTable.mangaId })

      const userHistoryLimit = await getUserHistoryLimitInTx(tx, userId)
      await enforceHistoryLimit(tx, userId, userHistoryLimit)

      return result
    })

    return ok(result.length)
  } catch (error) {
    captureException(error)
    return internalServerError('읽기 기록 동기화 중 오류가 발생했어요')
  }
}

const saveRatingSchema = z.object({
  mangaId: z.number().int().positive(),
  rating: z.number().int().min(0).max(5),
})

export async function saveRating(data: { mangaId: number; rating: number }) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = saveRatingSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { mangaId, rating } = validation.data

  try {
    if (rating === 0) {
      await db
        .delete(userRatingTable)
        .where(sql`${userRatingTable.userId} = ${userId} AND ${userRatingTable.mangaId} = ${mangaId}`)
    } else {
      await db
        .insert(userRatingTable)
        .values({
          userId,
          mangaId,
          rating,
        })
        .onConflictDoUpdate({
          target: [userRatingTable.userId, userRatingTable.mangaId],
          set: {
            rating,
            updatedAt: new Date(),
          },
        })
    }

    return ok(true)
  } catch (error) {
    captureException(error)
    return internalServerError('평가 저장 중 오류가 발생했어요')
  }
}
