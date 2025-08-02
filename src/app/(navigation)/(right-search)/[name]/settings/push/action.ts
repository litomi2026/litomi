'use server'

import { captureException } from '@sentry/nextjs'
import { cookies } from 'next/headers'

import { NotificationService } from '@/lib/notification/NotificationService'
import { badRequest, created, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { subscriptionSchema, testNotificationSchema, unsubscribeSchema } from './schema'

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
    return created('해당 기기의 푸시 알림이 활성화됐어요')
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
    return ok('해당 기기의 푸시 알림이 비활성화됐어요')
  } catch (error) {
    captureException(error, { tags: { action: 'unsubscribeFromNotifications' } })
    return internalServerError('푸시 알림 비활성화 중 오류가 발생했어요')
  }
}
