import { PASSWORD_HASH_COST } from '@litomi/auth/password'
import { type POSTV1AuthSignupResponse, PROBLEM, postV1AuthSignupRequestSchema } from '@litomi/contracts'
import { generateRandomNickname, generateRandomProfileImage } from '@litomi/domain/utils/nickname'
import { getRequestIP } from '@litomi/http/request'
import TurnstileValidator from '@litomi/http/turnstile'
import { hash } from 'bcryptjs'
import { Hono } from 'hono'
import { issueAuthCookies } from '@/api/v1/auth/session.query'
import { createUser } from '@/api/v1/auth/signup/query'
import type { Env } from '@/app'
import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { RedisRateLimiter, RedisRateLimitPresets } from '@/utils/rate-limit'
import { zProblemValidator } from '@/utils/validator'

const signupLimiter = new RedisRateLimiter({
  ...RedisRateLimitPresets.strict(),
  scope: 'auth-signup:ip',
})

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1AuthSignupRequestSchema), async (c) => {
  const { loginId, nickname: requestedNickname, password, turnstileToken } = c.req.valid('json')
  const nickname = requestedNickname ? requestedNickname : generateRandomNickname()
  const validator = new TurnstileValidator()
  const remoteIP = getRequestIP(c.req.raw.headers)

  const turnstile = await validator.validate({
    token: turnstileToken,
    remoteIP,
    expectedAction: 'signup',
  })

  if (!turnstile.success) {
    return problemResponse(c, { problem: PROBLEM.HUMAN_VERIFICATION_FAILED })
  }

  const { allowed, retryAfter } = await signupLimiter.check(remoteIP)

  if (!allowed) {
    return tooManyRequestsProblemResponse(c, retryAfter)
  }

  const passwordHash = await hash(password, PASSWORD_HASH_COST)

  try {
    const result = await createUser({
      imageURL: generateRandomProfileImage(),
      loginId,
      nickname,
      passwordHash,
    })

    if (!result) {
      return problemResponse(c, {
        problem: PROBLEM.LOGIN_ID_CONFLICT,
        extensions: {
          invalidParams: [
            {
              name: 'loginId',
              code: PROBLEM.LOGIN_ID_CONFLICT.slug,
              reason: '이미 사용 중인 아이디예요',
            },
          ],
        },
      })
    }

    const cookieConfigs = await issueAuthCookies({
      userId: result.id,
      adult: false,
      remember: false,
    })

    applyAuthCookie(c, cookieConfigs)

    const response = {
      userId: result.id,
      loginId,
      name: loginId,
      nickname,
    } satisfies POSTV1AuthSignupResponse

    return c.json(response, 201)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
