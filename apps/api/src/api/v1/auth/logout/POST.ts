import type { POSTV1AuthLogoutResponse } from '@litomi/contracts'

import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { CookieKey } from '@litomi/http/cookie'
import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { touchUserLogoutAtAndReturnLoginId } from '@/api/v1/auth/query'
import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse } from '@/utils/problem'

import { hashToken, revokeCurrentSessionByTokenHash } from '../session.query'

const route = new Hono<Env>()

route.post('/', async (c) => {
  const userId = c.get('userId')
  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)
  const now = new Date()

  try {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken)
      await revokeCurrentSessionByTokenHash(tokenHash, now)
    }

    if (!userId) {
      applyAuthCookie(c, getAuthCookieClearConfigs())
      return c.json<POSTV1AuthLogoutResponse>({ loginId: null })
    }

    const user = await touchUserLogoutAtAndReturnLoginId(userId, now)

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

export default route
