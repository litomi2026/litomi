import { hash } from 'bcryptjs'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { SALT_ROUNDS } from '@/constants'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'
import { loginIdSchema, nicknameSchema, passwordSchema } from '@/database/zod'
import { getAccessTokenCookieConfig, getAuthHintCookieConfig } from '@/utils/cookie'
import { generateRandomNickname, generateRandomProfileImage } from '@/utils/nickname'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
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
const signupRoutes = new Hono<Env>()

signupRoutes.post('/', zProblemValidator('json', signupRequestSchema), async (c) => {
  const { loginId, nickname, password, turnstileToken } = c.req.valid('json')
  const validator = new TurnstileValidator()

  const remoteIP =
    c.req.header('CF-Connecting-IP') || c.req.header('x-real-ip') || c.req.header('x-forwarded-for') || 'unknown'

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
      detail: `너무 많은 회원가입 시도가 있었어요. ${minutes}분 후에 다시 시도해 주세요.`,
      headers: { 'Retry-After': String(seconds) },
    })
  }

  const passwordHash = await hash(password, SALT_ROUNDS)

  try {
    const [result] = await db
      .insert(userTable)
      .values({
        loginId,
        name: loginId,
        passwordHash,
        nickname,
        imageURL: generateRandomProfileImage(),
      })
      .onConflictDoNothing()
      .returning({ id: userTable.id })

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

    const accessTokenCookie = await getAccessTokenCookieConfig({ userId: result.id, adult: false })
    const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: accessTokenCookie.options.maxAge })

    setCookie(c, accessTokenCookie.key, accessTokenCookie.value, accessTokenCookie.options)
    setCookie(c, authHintCookie.key, authHintCookie.value, authHintCookie.options)

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

export default signupRoutes
