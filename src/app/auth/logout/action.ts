'use server'

import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { TokenType, verifyJWT } from '@/utils/jwt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

export default async function logout() {
  const cookieStore = await cookies()

  const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value ?? ''
  const { sub: userId } = await verifyJWT(accessToken, TokenType.ACCESS).catch(() => ({ sub: null }))

  if (!userId) {
    return { error: '로그인 후 시도해주세요' }
  }

  db.update(userTable)
    .set({ logoutAt: new Date() })
    .where(sql`${userTable.id} = ${userId}`)

  cookieStore.delete(CookieKey.ACCESS_TOKEN)
  cookieStore.delete(CookieKey.REFRESH_TOKEN)

  return { success: true }
}
