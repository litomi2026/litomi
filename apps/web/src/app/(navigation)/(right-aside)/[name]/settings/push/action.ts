'use server'

import { getUserIdFromCookie } from '@litomi/auth/cookie'
import { WebPushService } from '@litomi/notifications'
import { captureException } from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'

import { badRequest, created, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { flattenZodFieldErrors } from '@/utils/form-error'

import {
  subscriptionSchema,
  unsubscribeSchema,
} from './schema'

export async function subscribeToNotifications(data: Record<string, unknown>) {
  const userId = await getUserIdFromCookie()

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
    await notificationService.registerPushSubscription(userId, subscription, userAgent)
    revalidatePath(`/@${username}/settings`)
    return created('이 브라우저의 푸시 알림을 활성화했어요')
  } catch (error) {
    captureException(error, { tags: { action: 'subscribeToNotifications' } })
    return internalServerError('푸시 알림을 활성화하지 못했어요')
  }
}

export async function unsubscribeFromNotifications(data: Record<string, unknown>) {
  const userId = await getUserIdFromCookie()

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
