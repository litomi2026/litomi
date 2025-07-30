'use server'

import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { noContent, serverError, unauthorized } from '@/utils/action-response'
import { getUserIdFromAccessToken } from '@/utils/cookie'

export default async function logout() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return unauthorized('로그인 정보가 없거나 만료됐어요')
  }

  const [user] = await db
    .update(userTable)
    .set({ logoutAt: new Date() })
    .where(sql`${userTable.id} = ${userId}`)
    .returning({ name: userTable.name })

  if (!user) {
    return serverError('로그아웃 중 오류가 발생했어요')
  }

  cookieStore.delete(CookieKey.ACCESS_TOKEN)
  cookieStore.delete(CookieKey.REFRESH_TOKEN)

  return noContent()
}
