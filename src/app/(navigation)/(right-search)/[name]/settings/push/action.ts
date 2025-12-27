'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { NotificationType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { notificationTable, pushSettingsTable, webPushTable } from '@/database/supabase/notification'
import { WebPushService } from '@/lib/notification/WebPushService'
import { badRequest, conflict, created, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import {
  removeDeviceSchema,
  subscriptionSchema,
  testNotificationSchema,
  unsubscribeSchema,
  updatePushSettingsSchema,
} from './schema'

export async function removeDevice(params: Record<string, unknown>) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = removeDeviceSchema.safeParse(params)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { deviceId, username } = validation.data

  try {
    await db.delete(webPushTable).where(and(eq(webPushTable.id, deviceId), eq(webPushTable.userId, userId)))
    revalidatePath(`/${username}/settings`)
    return ok('푸시 알림을 해제했어요')
  } catch (error) {
    captureException(error, { tags: { action: 'removeDevice' } })
    return internalServerError('푸시 알림을 해제하지 못했어요')
  }
}

export async function subscribeToNotifications(data: Record<string, unknown>) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = subscriptionSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { subscription, userAgent, username } = validation.data
  const notificationService = WebPushService.getInstance()

  try {
    const upsertedSubscription = await notificationService.subscribeUser(userId, subscription, userAgent)

    if (!upsertedSubscription) {
      return conflict('현재 브라우저는 이미 등록되어 있어요')
    }

    revalidatePath(`/@${username}/settings`)
    return created('이 브라우저의 푸시 알림을 활성화했어요')
  } catch (error) {
    captureException(error, { tags: { action: 'subscribeToNotifications' } })
    return internalServerError('푸시 알림을 활성화하지 못했어요')
  }
}

export async function testNotification(data: Record<string, unknown>) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = testNotificationSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { message, endpoint } = validation.data
  const notificationService = WebPushService.getInstance()

  try {
    await notificationService.sendTestWebPushToEndpoint(userId, endpoint, {
      title: '테스트 알림',
      body: message,
      icon: '/icon.png',
      badge: '/badge.png',
      data: { url: 'https://litomi.in' },
    })

    await db.insert(notificationTable).values({
      userId,
      type: NotificationType.TEST,
      title: '테스트 알림',
      body: message,
      data: null,
      sentAt: new Date(),
    })

    return ok('현재 브라우저에 테스트 알림을 보냈어요')
  } catch (error) {
    captureException(error, { tags: { action: 'testNotification' } })
    return internalServerError('테스트 푸시 알림 발송 중 오류가 발생했어요')
  }
}

export async function unsubscribeFromNotifications(data: Record<string, unknown>) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = unsubscribeSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { endpoint, username } = validation.data

  try {
    const notificationService = WebPushService.getInstance()
    await notificationService.unsubscribeUser(userId, endpoint)
    revalidatePath(`/@${username}/settings`)
    return ok('이 브라우저의 푸시 알림을 비활성화했어요')
  } catch (error) {
    captureException(error, { tags: { action: 'unsubscribeFromNotifications' } })
    return internalServerError('푸시 알림 비활성화 중 오류가 발생했어요')
  }
}

export async function updatePushSettings(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인이 필요해요')
  }

  const validation = updatePushSettingsSchema.safeParse({
    username: formData.get('username'),
    quietEnabled: formData.has('quietEnabled'),
    quietStart: formData.get('quietStart'),
    quietEnd: formData.get('quietEnd'),
    batchEnabled: formData.has('batchEnabled'),
    maxDaily: formData.get('maxDaily'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { username, ...rest } = validation.data
  const updateValues = { ...rest, updatedAt: new Date() }

  try {
    await db
      .insert(pushSettingsTable)
      .values({
        userId,
        ...updateValues,
      })
      .onConflictDoUpdate({
        target: pushSettingsTable.userId,
        set: updateValues,
      })

    revalidatePath(`/@${username}`)
    return ok('푸시 알림을 설정했어요')
  } catch (error) {
    captureException(error, { tags: { action: 'updateNotificationSettings' } })
    return internalServerError('푸시 알림 설정 중 오류가 발생했어요', formData)
  }
}
