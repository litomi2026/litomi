'use server'

import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'

export default async function logout() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return { status: 401, error: '로그인 정보가 없거나 만료됐어요.' }
  }

  await db
    .update(userTable)
    .set({ logoutAt: new Date() })
    .where(sql`${userTable.id} = ${userId}`)

  cookieStore.delete(CookieKey.ACCESS_TOKEN)
  cookieStore.delete(CookieKey.REFRESH_TOKEN)

  return { success: true }
}
