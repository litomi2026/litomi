import { CookieKey } from '@/constants/storage'
import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'
import { TokenType, verifyJWT } from '@/utils/jwt'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()

  // const accessToken = cookieStore.get(CookieKey.ACCESS_TOKEN)?.value ?? ''
  // const { sub: userId } = await verifyJWT(accessToken, TokenType.ACCESS)

  // db.update(userTable)
  //   .set({ loginAt: new Date() })
  //   .where(sql`${userTable.id} = ${userId}`)

  // cookieStore.delete(CookieKey.ACCESS_TOKEN)
  // cookieStore.delete(CookieKey.REFRESH_TOKEN)
}
