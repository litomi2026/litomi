import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import type { POSTV1AuthLogoutResponse } from '@litomi/contracts'
import { CookieKey } from '@litomi/http/cookie'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { touchUserLogoutAtAndReturnLoginId } from '@/api/v1/auth/query'
import type { Env } from '@/app'
import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse } from '@/utils/problem'

import { hashToken, revokeCurrentSessionByTokenHash } from '../session.query'

const route = new Hono<Env>()

route.post('/', async (c) => {
  const userId = c.get('userId')
  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)
  const now = new Date()

  try {
    let sessionUserId: number | undefined

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken)
      sessionUserId = (await revokeCurrentSessionByTokenHash(tokenHash, now))?.userId
    }

    const logoutUserId = userId ?? sessionUserId

    if (!logoutUserId) {
      applyAuthCookie(c, getAuthCookieClearConfigs())
      return c.json({ loginId: null } satisfies POSTV1AuthLogoutResponse)
    }

    const user = await touchUserLogoutAtAndReturnLoginId(logoutUserId, now)

    if (!user) {
      applyAuthCookie(c, getAuthCookieClearConfigs())
      return c.json({ loginId: null } satisfies POSTV1AuthLogoutResponse)
    }

    applyAuthCookie(c, getAuthCookieClearConfigs())

    return c.json({ loginId: user.loginId } satisfies POSTV1AuthLogoutResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '로그아웃 중 오류가 발생했어요' })
  }
})

export default route
