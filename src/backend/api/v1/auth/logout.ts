import { eq } from 'drizzle-orm'
import { Hono } from 'hono'

import { Env } from '@/backend'
import { clearAuthCookies } from '@/backend/utils/auth'
import { problemResponse } from '@/backend/utils/problem'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'

export type POSTV1AuthLogoutResponse = {
  loginId: string | null
}

const logoutRoutes = new Hono<Env>()

logoutRoutes.post('/', async (c) => {
  const userId = c.get('userId')

  try {
    if (!userId) {
      clearAuthCookies(c)
      return c.json<POSTV1AuthLogoutResponse>({ loginId: null })
    }

    const [user] = await db
      .update(userTable)
      .set({ logoutAt: new Date() })
      .where(eq(userTable.id, userId))
      .returning({ loginId: userTable.loginId })

    if (!user) {
      clearAuthCookies(c)
      return c.json<POSTV1AuthLogoutResponse>({ loginId: null })
    }

    clearAuthCookies(c)

    return c.json<POSTV1AuthLogoutResponse>({ loginId: user.loginId })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '로그아웃 중 오류가 발생했어요' })
  }
})

export default logoutRoutes
