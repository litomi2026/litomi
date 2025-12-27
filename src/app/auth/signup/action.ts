'use server'

import { captureException } from '@sentry/nextjs'
import { hash } from 'bcryptjs'
import { cookies, headers } from 'next/headers'
import { z } from 'zod'

import { SALT_ROUNDS } from '@/constants'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'
import { loginIdSchema, nicknameSchema, passwordSchema } from '@/database/zod'
import { badRequest, conflict, created, internalServerError, tooManyRequests } from '@/utils/action-response'
import { getAccessTokenCookieConfig } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { generateRandomNickname, generateRandomProfileImage } from '@/utils/nickname'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import TurnstileValidator, { getTurnstileToken } from '@/utils/turnstile'

const signupSchema = z
  .object({
    loginId: loginIdSchema,
    password: passwordSchema,
    'password-confirm': z.string(),
    nickname: nicknameSchema,
  })
  .refine((data) => data.password === data['password-confirm'], {
    error: '비밀번호와 비밀번호 확인 값이 일치하지 않아요',
    path: ['password-confirm'],
  })
  .refine((data) => data.loginId !== data.password, {
    error: '아이디와 비밀번호는 같을 수 없어요',
    path: ['password'],
  })

const signupLimiter = new RateLimiter(RateLimitPresets.strict())

export default async function signup(formData: FormData) {
  const validator = new TurnstileValidator()
  const turnstileToken = getTurnstileToken(formData)
  const headersList = await headers()

  const remoteIP =
    headersList.get('CF-Connecting-IP') ||
    headersList.get('x-real-ip') ||
    headersList.get('x-forwarded-for') ||
    'unknown'

  const turnstile = await validator.validate({
    token: turnstileToken,
    remoteIP,
    expectedAction: 'signup',
  })

  if (!turnstile.success) {
    const message = validator.getTurnstileErrorMessage(turnstile['error-codes'])
    return badRequest(message, formData)
  }

  const { allowed, retryAfter } = await signupLimiter.check(remoteIP)

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 회원가입 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`, formData)
  }

  const validation = signupSchema.safeParse({
    loginId: formData.get('loginId'),
    password: formData.get('password'),
    'password-confirm': formData.get('password-confirm'),
    nickname: formData.get('nickname') || generateRandomNickname(),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { loginId, password, nickname } = validation.data
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
      return conflict({ loginId: '이미 사용 중인 아이디예요' }, formData)
    }

    const { id: userId } = result
    const cookieStore = await cookies()
    const { key, value, options } = await getAccessTokenCookieConfig(userId)
    cookieStore.set(key, value, options)

    return created({
      userId,
      loginId,
      name: loginId,
      nickname,
    })
  } catch (error) {
    captureException(error, { extra: { name: 'signup', loginId } })
    return internalServerError('회원가입 중 오류가 발생했어요', formData)
  }
}
