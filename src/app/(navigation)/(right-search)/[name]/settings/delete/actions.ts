'use server'

import { captureException } from '@sentry/nextjs'
import { compare } from 'bcrypt'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { CookieKey } from '@/constants/storage'
import { db } from '@/database/supabase/drizzle'
import { bookmarkTable, userCensorshipTable, userTable } from '@/database/supabase/schema'
import { passwordSchema } from '@/database/zod'
import { badRequest, internalServerError, ok, unauthorized } from '@/utils/action-response'
import { validateUserIdFromCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

const deleteAccountSchema = z.object({
  password: passwordSchema,
})

export async function deleteAccount(formData: FormData) {
  const userId = await validateUserIdFromCookie()

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

    await db.delete(userTable).where(eq(userTable.id, userId))

    const cookieStore = await cookies()
    cookieStore.delete(CookieKey.ACCESS_TOKEN)
    cookieStore.delete(CookieKey.REFRESH_TOKEN)
    return ok(`${user.loginId} 계정을 삭제했어요`)
  } catch (error) {
    captureException(error)
    return internalServerError('계정 삭제 중 오류가 발생했어요', formData)
  }
}

export async function exportUserData() {
  const userId = await validateUserIdFromCookie()

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
      .where(eq(userTable.id, userId))

    if (!user) {
      return unauthorized('사용자를 찾을 수 없어요')
    }

    const bookmarks = await db
      .select({
        mangaId: bookmarkTable.mangaId,
        createdAt: bookmarkTable.createdAt,
      })
      .from(bookmarkTable)
      .where(eq(bookmarkTable.userId, userId))

    const censorships = await db
      .select({
        key: userCensorshipTable.key,
        value: userCensorshipTable.value,
        level: userCensorshipTable.level,
        createdAt: userCensorshipTable.createdAt,
      })
      .from(userCensorshipTable)
      .where(eq(userCensorshipTable.userId, userId))

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      bookmarks: bookmarks.map((bookmark) => ({
        mangaId: bookmark.mangaId,
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
