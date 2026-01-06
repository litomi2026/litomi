import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'
import 'server-only'

import { Env } from '@/backend'
import { requireAuth } from '@/backend/middleware/require-auth'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { CookieKey } from '@/constants/storage'
import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'

export type AdultVerificationStatus = 'adult' | 'not_adult' | 'unverified'

export type GETV1MeResponse = {
  id: number
  loginId: string
  name: string
  nickname: string
  imageURL: string | null
  adultVerification: {
    required: boolean
    status: AdultVerificationStatus
  }
}

const meRoutes = new Hono<Env>()

meRoutes.get('/', requireAuth, async (c) => {
  const userId = c.get('userId')!

  try {
    const [user] = await db
      .select({
        id: userTable.id,
        loginId: userTable.loginId,
        name: userTable.name,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
        adultFlag: bbatonVerificationTable.adultFlag,
      })
      .from(userTable)
      .leftJoin(bbatonVerificationTable, eq(bbatonVerificationTable.userId, userTable.id))
      .where(eq(userTable.id, userId))

    if (!user) {
      deleteCookie(c, CookieKey.ACCESS_TOKEN)
      deleteCookie(c, CookieKey.REFRESH_TOKEN)
      return problemResponse(c, { status: 404, detail: '사용자 정보를 찾을 수 없어요' })
    }

    const country = c.req.header('CF-IPCountry')?.trim().toUpperCase() ?? 'KR'
    const required = country === 'KR'
    const isAdult = c.get('isAdult') === true
    const status: AdultVerificationStatus = isAdult ? 'adult' : user.adultFlag === false ? 'not_adult' : 'unverified'

    const result: GETV1MeResponse = {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      nickname: user.nickname,
      imageURL: user.imageURL,
      adultVerification: { required, status },
    }

    return c.json<GETV1MeResponse>(result, { headers: { 'Cache-Control': privateCacheControl } })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '사용자 정보를 불러오지 못했어요' })
  }
})

export default meRoutes
