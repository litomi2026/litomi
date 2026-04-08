import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'

import { Env } from '@/backend'
import { touchUserLogoutAtAndReturnLoginId } from '@/backend/api/v1/auth/query'
import { revokeCurrentSession } from '@/backend/api/v1/auth/session'
import { applyAuthCookie } from '@/backend/utils/cookie'
import { problemResponse } from '@/backend/utils/problem'
import { CookieKey } from '@/constants/storage'
import { getAuthCookieClearConfigs } from '@/utils/cookie'

export type POSTV1AuthLogoutResponse = {
  loginId: string | null
}

const logoutRoutes = new Hono<Env>()

logoutRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)

  try {
    await revokeCurrentSession(refreshToken)

    if (!userId) {
      applyAuthCookie(c, getAuthCookieClearConfigs())
      return c.json<POSTV1AuthLogoutResponse>({ loginId: null })
    }

    const user = await touchUserLogoutAtAndReturnLoginId(userId, new Date())

    if (!user) {
      applyAuthCookie(c, getAuthCookieClearConfigs())
      return c.json<POSTV1AuthLogoutResponse>({ loginId: null })
    }

    applyAuthCookie(c, getAuthCookieClearConfigs())

    return c.json<POSTV1AuthLogoutResponse>({ loginId: user.loginId })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '로그아웃 중 오류가 발생했어요' })
  }
})

export default logoutRoutes
