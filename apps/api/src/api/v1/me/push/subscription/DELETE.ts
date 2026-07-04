import { deleteV1MePushSubscriptionBodySchema } from '@litomi/contracts'
import { WebPushService } from '@litomi/notifications'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.delete('/', zProblemValidator('json', deleteV1MePushSubscriptionBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { endpoint } = c.req.valid('json')
  const notificationService = WebPushService.getInstance()

  try {
    await notificationService.unsubscribeUser(userId, endpoint)

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
