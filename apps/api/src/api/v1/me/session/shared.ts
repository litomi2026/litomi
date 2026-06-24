import { hashSessionToken } from '@litomi/auth/session'
import { CookieKey } from '@litomi/http/cookie'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { readCurrentSessionFamilyIdByTokenHash } from './query'

export async function getCurrentSessionFamilyId(c: Context<Env>, userId: number) {
  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)

  if (!refreshToken) {
    return null
  }

  return await readCurrentSessionFamilyIdByTokenHash(userId, hashSessionToken(refreshToken))
}
