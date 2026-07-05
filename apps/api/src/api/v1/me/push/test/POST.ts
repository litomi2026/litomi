import { postV1MePushTestBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { notificationTable } from '@litomi/db/app/notification'
import { NotificationType } from '@litomi/domain/notification/model'
import { WebPushService } from '@litomi/notifications'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', postV1MePushTestBodySchema))

route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { endpoint, message } = c.req.valid('json')
  const notificationService = WebPushService.getInstance()

  try {
    await notificationService.sendTestWebPushToEndpoint(userId, endpoint, {
      title: '테스트 알림',
      body: message,
      icon: '/icon.png',
      badge: '/badge.png',
      data: { url: 'https://litomi.cc' },
    })

    await db.insert(notificationTable).values({
      userId,
      type: NotificationType.TEST,
      title: '테스트 알림',
      body: message,
      data: null,
      sentAt: new Date(),
    })

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
