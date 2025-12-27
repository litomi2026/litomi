'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { notificationTable } from '@/database/supabase/notification'
import { badRequest, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'

import { deleteNotificationsSchema, markAsReadSchema } from './schema'

export async function deleteNotifications(data: Record<string, unknown>) {
  const userId = await validateUserIdFromCookie()

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
      .where(and(eq(notificationTable.userId, userId), inArray(notificationTable.id, ids)))

    return ok('알림을 삭제했어요')
  } catch (error) {
    captureException(error, { extra: data })
    return internalServerError('알림 삭제 중 오류가 발생했어요')
  }
}

export async function markAllAsRead() {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    await db
      .update(notificationTable)
      .set({ read: true })
      .where(and(eq(notificationTable.userId, userId), eq(notificationTable.read, false)))

    return ok('모든 알림을 읽었어요')
  } catch (error) {
    captureException(error, { extra: { userId } })
    return internalServerError('알림을 읽는 도중 오류가 발생했어요')
  }
}

export async function markAsRead(data: Record<string, unknown>) {
  const userId = await validateUserIdFromCookie()

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
      .set({ read: true })
      .where(and(eq(notificationTable.userId, userId), inArray(notificationTable.id, ids)))

    return ok('알림을 읽었어요')
  } catch (error) {
    captureException(error, { extra: { userId, ids } })
    return internalServerError('알림을 읽는 도중 오류가 발생했어요')
  }
}
