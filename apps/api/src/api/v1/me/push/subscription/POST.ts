import { type POSTV1MePushSubscriptionResponse, postV1MePushSubscriptionBodySchema } from '@litomi/contracts'
import { WebPushService } from '@litomi/notifications'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1MePushSubscriptionBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { subscription, userAgent } = c.req.valid('json')
  const notificationService = WebPushService.getInstance()

  try {
    const savedSubscription = await notificationService.registerPushSubscription(userId, subscription, userAgent)

    const result = {
      id: savedSubscription.id,
      message: '이 브라우저의 푸시 알림을 활성화했어요',
    } satisfies POSTV1MePushSubscriptionResponse

    return c.json(result, 201)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '푸시 알림을 활성화하지 못했어요' })
  }
})

export default route
