import { postV1MePushSubscriptionTestBodySchema, type POSTV1MePushSubscriptionTestResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { notificationTable } from '@litomi/db/app/notification'
import { NotificationType } from '@litomi/domain/database/enum'
import { WebPushService } from '@litomi/notifications'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1MePushSubscriptionTestBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { endpoint, message } = c.req.valid('json')
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

    return c.json<POSTV1MePushSubscriptionTestResponse>({ message: '현재 브라우저에 테스트 알림을 보냈어요' })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '테스트 푸시 알림 발송 중 오류가 발생했어요' })
  }
})

export default route
