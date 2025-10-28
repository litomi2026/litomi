'use server'

import { captureException } from '@sentry/nextjs'
import { compare, hash } from 'bcrypt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { SALT_ROUNDS } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/schema'
import { passwordSchema } from '@/database/zod'
import { badRequest, created, internalServerError, tooManyRequests, unauthorized } from '@/utils/action-response'
import { deleteCookie, validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, '새 비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '새 비밀번호가 일치하지 않아요',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '현재 비밀번호와 새 비밀번호가 같아요',
    path: ['newPassword'],
  })

const passwordChangeLimiter = new RateLimiter(RateLimitPresets.strict())

export async function changePassword(formData: FormData) {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { currentPassword, newPassword } = validation.data
  const { allowed, retryAfter } = await passwordChangeLimiter.check(userId.toString())

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 비밀번호 변경 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`)
  }

  try {
    const errorResponse = await db.transaction(async (tx) => {
      const [user] = await tx
        .select({ passwordHash: userTable.passwordHash })
        .from(userTable)
        .where(sql`${userTable.id} = ${userId}`)

      const isValidPassword = await compare(currentPassword, user.passwordHash)

      if (!isValidPassword) {
        return unauthorized('현재 비밀번호가 일치하지 않아요', formData)
      }

      const newPasswordHash = await hash(newPassword, SALT_ROUNDS)

      await tx
        .update(userTable)
        .set({
          passwordHash: newPasswordHash,
          loginAt: new Date(),
        })
        .where(sql`${userTable.id} = ${userId}`)
    })

    if (errorResponse) {
      return errorResponse
    }

    const [cookieStore] = await Promise.all([cookies(), passwordChangeLimiter.reward(userId.toString())])
    deleteCookie(cookieStore, CookieKey.ACCESS_TOKEN)
    deleteCookie(cookieStore, CookieKey.REFRESH_TOKEN)
    return created('비밀번호가 변경됐어요')
  } catch (error) {
    captureException(error)
    return internalServerError('비밀번호 변경 중 오류가 발생했어요', formData)
  }
}
