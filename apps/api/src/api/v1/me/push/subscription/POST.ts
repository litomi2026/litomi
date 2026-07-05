import { type POSTV1MePushSubscriptionResponse, postV1MePushSubscriptionBodySchema } from '@litomi/contracts'
import { WebPushService } from '@litomi/notifications'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(zProblemValidator('json', postV1MePushSubscriptionBodySchema))

route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { subscription, userAgent } = c.req.valid('json')
  const notificationService = WebPushService.getInstance()

  try {
    const savedSubscription = await notificationService.registerPushSubscription(userId, subscription, userAgent)

    const result = {
      id: savedSubscription.id,
    } satisfies POSTV1MePushSubscriptionResponse

    return c.json(result, 201)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
