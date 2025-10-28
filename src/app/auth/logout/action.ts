'use server'

import { captureException } from '@sentry/nextjs'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { CookieKey } from '@/constants/storage'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/schema'
import { internalServerError, ok, unauthorized } from '@/utils/action-response'
import { deleteCookie, validateUserIdFromCookie } from '@/utils/cookie'

export default async function logout() {
  const userId = await validateUserIdFromCookie()

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  try {
    const [user] = await db
      .update(userTable)
      .set({ logoutAt: new Date() })
      .where(sql`${userTable.id} = ${userId}`)
      .returning({ loginId: userTable.loginId })

    const cookieStore = await cookies()
    deleteCookie(cookieStore, CookieKey.ACCESS_TOKEN)
    deleteCookie(cookieStore, CookieKey.REFRESH_TOKEN)

    return ok(user)
  } catch (error) {
    captureException(error)
    return internalServerError('로그아웃 중 오류가 발생했어요')
  }
}
