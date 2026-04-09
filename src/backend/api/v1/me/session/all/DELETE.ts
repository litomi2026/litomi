import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { applyAuthCookie } from '@/backend/utils/cookie'
import { problemResponse } from '@/backend/utils/problem'
import { getAuthCookieClearConfigs } from '@/utils/cookie'

import type { DELETEV1MeSessionResponse } from '../shared'

import { revokeAllSessionsByUserId } from '../query'

const route = new Hono<Env>()

route.delete('/', async (c) => {
  const userId = c.get('userId')!
  const now = new Date()

  try {
    await revokeAllSessionsByUserId(userId, now)
    applyAuthCookie(c, getAuthCookieClearConfigs())

    return c.json<DELETEV1MeSessionResponse>({
      clearedCurrentSession: true,
      message: '모든 기기에서 로그아웃했어요',
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '로그아웃 중 문제가 발생했어요' })
  }
})

export default route
