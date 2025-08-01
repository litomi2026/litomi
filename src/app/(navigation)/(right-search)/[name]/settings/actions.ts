'use server'

import { captureException } from '@sentry/nextjs'
import { compare, hash } from 'bcrypt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { SALT_ROUNDS } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { bookmarkTable, userCensorshipTable, userTable } from '@/database/schema'
import { passwordSchema } from '@/database/zod'
import { badRequest, created, internalServerError, ok, tooManyRequests, unauthorized } from '@/utils/action-response'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { mapBookmarkSourceToSourceParam } from '@/utils/param'
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

const deleteAccountSchema = z.object({
  password: passwordSchema,
})

const passwordChangeLimiter = new RateLimiter(RateLimitPresets.strict())

export async function changePassword(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

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
  const { allowed, retryAfter } = await passwordChangeLimiter.check(userId)

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

    cookieStore.delete(CookieKey.ACCESS_TOKEN)
    cookieStore.delete(CookieKey.REFRESH_TOKEN)
    passwordChangeLimiter.reward(userId)
    return created('비밀번호가 변경됐어요')
  } catch (error) {
    captureException(error)
    return internalServerError('비밀번호 변경 중 오류가 발생했어요', formData)
  }
}

export async function deleteAccount(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

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
      .where(sql`${userTable.id} = ${userId}`)

    const isValidPassword = await compare(password, user.passwordHash)

    if (!isValidPassword) {
      return unauthorized('비밀번호가 일치하지 않아요', formData)
    }

    await db.delete(userTable).where(sql`${userTable.id} = ${userId}`)

    cookieStore.delete(CookieKey.ACCESS_TOKEN)
    cookieStore.delete(CookieKey.REFRESH_TOKEN)
    return ok(`${user.loginId} 계정을 삭제했어요`)
  } catch (error) {
    captureException(error)
    return internalServerError('계정 삭제 중 오류가 발생했어요', formData)
  }
}

export async function exportUserData(_prevState: unknown, _formData: FormData) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    const [user] = await db
      .select({
        createdAt: userTable.createdAt,
        loginId: userTable.loginId,
        name: userTable.name,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
      })
      .from(userTable)
      .where(sql`${userTable.id} = ${userId}`)

    if (!user) {
      return unauthorized('사용자를 찾을 수 없어요')
    }

    const bookmarks = await db
      .select({
        mangaId: bookmarkTable.mangaId,
        source: bookmarkTable.source,
        createdAt: bookmarkTable.createdAt,
      })
      .from(bookmarkTable)
      .where(sql`${bookmarkTable.userId} = ${userId}`)

    const censorships = await db
      .select({
        key: userCensorshipTable.key,
        value: userCensorshipTable.value,
        level: userCensorshipTable.level,
        createdAt: userCensorshipTable.createdAt,
      })
      .from(userCensorshipTable)
      .where(sql`${userCensorshipTable.userId} = ${userId}`)

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      bookmarks: bookmarks.map((bookmark) => ({
        mangaId: bookmark.mangaId,
        source: mapBookmarkSourceToSourceParam(bookmark.source),
        createdAt: bookmark.createdAt,
      })),
      censorships,
    }

    return ok(JSON.stringify(exportData, null, 2))
  } catch (error) {
    captureException(error)
    return internalServerError('데이터 내보내기 중 오류가 발생했어요')
  }
}
