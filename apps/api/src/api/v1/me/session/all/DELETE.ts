import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import type { DELETEV1MeSessionResponse } from '@litomi/contracts'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse } from '@/utils/problem'

import { revokeAllSessionsByUserId } from '../query'

const route = new Hono<Env>()

route.delete('/', async (c) => {
  const userId = c.get('userId')!
  const now = new Date()

  try {
    await revokeAllSessionsByUserId(userId, now)
    applyAuthCookie(c, getAuthCookieClearConfigs())

    return c.json({ clearedCurrentSession: true } satisfies DELETEV1MeSessionResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
