import { hash } from 'bcryptjs'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { issueAuthCookies } from '@/backend/api/v1/auth/session.query'
import { createUser } from '@/backend/api/v1/auth/signup/query'
import { applyAuthCookie } from '@/backend/utils/cookie'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { SALT_ROUNDS } from '@/constants'
import { loginIdSchema, nicknameSchema, passwordSchema } from '@/database/zod'
import { generateRandomNickname, generateRandomProfileImage } from '@/utils/nickname'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import { getRequestIP } from '@/utils/request'
import TurnstileValidator from '@/utils/turnstile'

export type POSTV1AuthSignupRequest = {
  loginId: string
  nickname?: string
  password: string
  passwordConfirm: string
  turnstileToken: string
}

export type POSTV1AuthSignupResponse = {
  userId: number
  loginId: string
  name: string
  nickname: string
}

const signupRequestSchema = z
  .object({
    loginId: loginIdSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
    nickname: z
      .union([nicknameSchema, z.literal(''), z.undefined()])
      .transform((value) => (value ? value : generateRandomNickname())),
    turnstileToken: z.string().min(1).max(2048),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    error: '비밀번호와 비밀번호 확인 값이 일치하지 않아요',
    path: ['passwordConfirm'],
  })
  .refine((data) => data.loginId !== data.password, {
    error: '아이디와 비밀번호는 같을 수 없어요',
    path: ['password'],
  })

const signupLimiter = new RateLimiter(RateLimitPresets.strict())
const route = new Hono<Env>()

route.post('/', zProblemValidator('json', signupRequestSchema), async (c) => {
  const { loginId, nickname, password, turnstileToken } = c.req.valid('json')
  const validator = new TurnstileValidator()
  const remoteIP = getRequestIP(c.req.raw.headers)

  const turnstile = await validator.validate({
    token: turnstileToken,
    remoteIP,
    expectedAction: 'signup',
  })

  if (!turnstile.success) {
    return problemResponse(c, {
      status: 400,
      code: 'human-verification-failed',
      detail: '보안 확인에 실패했어요',
    })
  }

  const { allowed, retryAfter } = await signupLimiter.check(remoteIP)

  if (!allowed) {
    const seconds = retryAfter ?? 60
    const minutes = Math.max(1, Math.ceil(seconds / 60))

    return problemResponse(c, {
      status: 429,
      detail: `너무 많이 시도했어요. ${minutes}분 후에 다시 시도해 주세요.`,
      headers: { 'Retry-After': String(seconds) },
    })
  }

  const passwordHash = await hash(password, SALT_ROUNDS)

  try {
    const result = await createUser({
      imageURL: generateRandomProfileImage(),
      loginId,
      nickname,
      passwordHash,
    })

    if (!result) {
      return problemResponse(c, {
        status: 409,
        code: 'login-id-conflict',
        detail: '이미 사용 중인 아이디예요',
        extensions: {
          invalidParams: [{ name: 'loginId', reason: '이미 사용 중인 아이디예요' }],
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
    }

    return c.json<POSTV1AuthSignupResponse>(response, 201)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '회원가입 중 오류가 발생했어요' })
  }
})

export default route
