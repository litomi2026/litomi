import { chatHandleParamSchema, type DELETEV1ChatSubscriptionResponse } from '@litomi/contracts'
import { stopChatSubscriptionRenewal } from '@litomi/db/app/query/chat'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toSubscriptionDTO } from '../../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', chatHandleParamSchema))

route.delete('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')

  // 핸들 해석이 UPDATE의 WHERE에 내장 — 없는 핸들과 구독 없음 모두 기존과 같은 404다.
  const subscription = await stopChatSubscriptionRenewal(userId, handle)

  if (!subscription) {
    return problemResponse(c, { status: 404 })
  }

  return c.json({ subscription: toSubscriptionDTO(subscription) } satisfies DELETEV1ChatSubscriptionResponse)
})

export default route
