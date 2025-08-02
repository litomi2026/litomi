'use server'

import { captureException } from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

import { db } from '@/database/drizzle'
import { pushSettingsTable } from '@/database/schema'
import { NotificationService } from '@/lib/notification/NotificationService'
import { badRequest, created, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { subscriptionSchema, testNotificationSchema, unsubscribeSchema, updatePushSettingsSchema } from './schema'

export async function subscribeToNotifications(data: Record<string, unknown>) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = subscriptionSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { subscription, userAgent } = validation.data
  const notificationService = NotificationService.getInstance()

  try {
    await notificationService.subscribeUser(userId, subscription, userAgent)
    return created('이 브라우저의 푸시 알림을 활성화했어요')
  } catch (error) {
    captureException(error, { tags: { action: 'subscribeToNotifications' } })
    return internalServerError('푸시 알림 활성화 중 오류가 발생했어요')
  }
}

export async function testNotification(data: Record<string, unknown>) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = testNotificationSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { message } = validation.data
  const notificationService = NotificationService.getInstance()

  try {
    const shouldSend = await notificationService.shouldSendNotification(userId)

    if (!shouldSend) {
      return badRequest('현재 알림을 보낼 수 없어요. 알림 설정을 확인해주세요.')
    }

    await notificationService.sendNotificationToUser(userId, {
      title: '테스트 알림',
      body: message,
      icon: '/icon.png',
      badge: '/badge.png',
      data: {
        timestamp: Date.now(),
        notificationType: 'test' as 'bookmark' | 'keyword',
      },
    })

    return ok('테스트 푸시 알림을 발송했어요')
  } catch (error) {
    captureException(error, { tags: { action: 'testNotification' } })
    return internalServerError('테스트 푸시 알림 발송 중 오류가 발생했어요')
  }
}

export async function unsubscribeFromNotifications(data: Record<string, unknown>) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const validation = unsubscribeSchema.safeParse(data)

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error))
  }

  const { endpoint } = validation.data

  try {
    const notificationService = NotificationService.getInstance()
    await notificationService.unsubscribeUser(Number(userId), endpoint)
    return ok('이 브라우저의 푸시 알림을 비활성화했어요')
  } catch (error) {
    captureException(error, { tags: { action: 'unsubscribeFromNotifications' } })
    return internalServerError('푸시 알림 비활성화 중 오류가 발생했어요')
  }
}

export async function updatePushSettings(formData: FormData) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return unauthorized('로그인이 필요합니다')
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
        userId: Number(userId),
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
