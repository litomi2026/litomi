import { deleteV1MePushSubscriptionBodySchema, type DELETEV1MePushSubscriptionResponse } from '@litomi/contracts'
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

    return c.json<DELETEV1MePushSubscriptionResponse>({ message: '이 브라우저의 푸시 알림을 비활성화했어요' })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '푸시 알림 비활성화 중 오류가 발생했어요' })
  }
})

export default route
