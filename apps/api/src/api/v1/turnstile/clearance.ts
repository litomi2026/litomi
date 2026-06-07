import {
  postV1TurnstileClearanceRequestSchema,
  type POSTV1TurnstileClearanceResponse,
  TURNSTILE_ORIGIN_PROTECTION_ACTION,
} from '@litomi/contracts'
import { getRequestIP } from '@litomi/http/request'
import TurnstileValidator from '@litomi/http/turnstile'
import { Hono } from 'hono'
import ms from 'ms'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { APP_ORIGIN } from '@/utils/request-origin'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

const turnstileValidator = new TurnstileValidator(ms('10 seconds'), 1)
const expectedHostname = new URL(APP_ORIGIN).hostname

route.post('/', zProblemValidator('json', postV1TurnstileClearanceRequestSchema), async (c) => {
  const { token } = c.req.valid('json')
  const remoteIP = getRequestIP(c.req.raw.headers)

  const turnstile = await turnstileValidator.validate({
    token,
    remoteIP,
    expectedAction: TURNSTILE_ORIGIN_PROTECTION_ACTION,
    expectedHostname,
  })

  if (!turnstile.success) {
    return problemResponse(c, {
      status: 400,
      code: 'human-verification-failed',
      detail: '보안 확인에 실패했어요',
    })
  }

  return c.json<POSTV1TurnstileClearanceResponse>({ verified: true })
})

export default route
