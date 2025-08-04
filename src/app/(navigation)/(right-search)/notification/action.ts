'use server'

import { captureException } from '@sentry/nextjs'
import { and, inArray, sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { notificationTable } from '@/database/schema'
import { badRequest, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { getUserIdFromCookie } from '@/utils/session'

import { deleteNotificationsSchema, markAsReadSchema } from './schema'

export async function deleteNotifications(data: Record<string, unknown>) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = deleteNotificationsSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(validation.error.message)
  }

  const { ids } = validation.data

  try {
    await db
      .delete(notificationTable)
      .where(and(sql`${notificationTable.userId} = ${userId}`, inArray(notificationTable.id, ids)))

    return ok('알림을 삭제했어요')
  } catch (error) {
    captureException(error, { extra: { userId, ids } })
    return internalServerError('알림 삭제 중 오류가 발생했어요')
  }
}

export async function markAllAsRead() {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    await db
      .update(notificationTable)
      .set({ read: 1 })
      .where(sql`${notificationTable.userId} = ${userId} AND ${notificationTable.read} = 0`)

    return ok('모든 알림을 읽었어요')
  } catch (error) {
    captureException(error, { extra: { userId } })
    return internalServerError('알림을 읽는 도중 오류가 발생했어요')
  }
}

export async function markAsRead(data: Record<string, unknown>) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = markAsReadSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(validation.error.message)
  }

  const { ids } = validation.data

  try {
    await db
      .update(notificationTable)
      .set({ read: 1 })
      .where(and(sql`${notificationTable.userId} = ${userId}`, inArray(notificationTable.id, ids)))

    return ok('알림을 읽었어요')
  } catch (error) {
    captureException(error, { extra: { userId, ids } })
    return internalServerError('알림을 읽는 도중 오류가 발생했어요')
  }
}
