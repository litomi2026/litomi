'use server'

import { captureException } from '@sentry/nextjs'
import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod'

import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'
import { passwordSchema } from '@/database/zod'
import { badRequest, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { applyCookieConfigs, getAuthCookieClearConfigs } from '@/utils/cookie'
import { getUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { revokeAllSessionsByUserId } from '../query'

const deleteAccountSchema = z.object({
  password: passwordSchema,
})

export async function deleteAccount(formData: FormData) {
  const userId = await getUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = deleteAccountSchema.safeParse({ password: formData.get('password') })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { password } = validation.data

  try {
    const [user] = await db
      .select({
        loginId: userTable.loginId,
        passwordHash: userTable.passwordHash,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))

    const isValidPassword = await compare(password, user.passwordHash)

    if (!isValidPassword) {
      return unauthorized('비밀번호가 일치하지 않아요', formData)
    }

    await revokeAllSessionsByUserId(userId, new Date())
    await db.delete(userTable).where(eq(userTable.id, userId))

    const cookieStore = await cookies()
    applyCookieConfigs(cookieStore, getAuthCookieClearConfigs())
    return ok(`${user.loginId} 계정을 삭제했어요`)
  } catch (error) {
    captureException(error)
    return internalServerError('계정 삭제 중 오류가 발생했어요', formData)
  }
}
