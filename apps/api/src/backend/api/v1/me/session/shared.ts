import { hashSessionToken } from '@litomi/auth/session'
import { CookieKey } from '@litomi/domain/constants/storage'
import { type Context } from 'hono'
import { getCookie } from 'hono/cookie'

import type { Env } from '@/backend'

import { readCurrentSessionFamilyIdByTokenHash } from './query'

export type DELETEV1MeSessionResponse = {
  clearedCurrentSession: boolean
  message: string
}

export async function getCurrentSessionFamilyId(c: Context<Env>, userId: number) {
  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)

  if (!refreshToken) {
    return null
  }

  return await readCurrentSessionFamilyIdByTokenHash(userId, hashSessionToken(refreshToken))
}
