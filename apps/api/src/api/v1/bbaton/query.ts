import { getAccessTokenCookieConfig, getAuthHintCookieConfig } from '@litomi/auth/cookie'
import { hashSessionToken } from '@litomi/auth/session'
import { db } from '@litomi/db/app'
import { authSessionFamilyTable, authSessionTokenTable } from '@litomi/db/app/auth'
import { CookieKey } from '@litomi/domain/constants/storage'
import { eq } from 'drizzle-orm'
import { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'

import type { Env } from '@/app'

type ActiveRefreshSession = {
  maxAgeSeconds: number
  userId: number
}

type RefreshSessionLookup = NonNullable<Awaited<ReturnType<typeof readRefreshSessionByTokenHash>>>

type ReissueAuthCookiesClaims = {
  adult: boolean
  userId: number
}

export async function reissueAuthCookies(c: Context<Env>, { userId, adult }: ReissueAuthCookiesClaims): Promise<void> {
  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)
  const activeSession = refreshToken ? await readActiveRefreshSession(refreshToken) : null
  const hasPersistentSession = activeSession?.userId === userId
  const accessTokenCookie = await getAccessTokenCookieConfig({ userId, adult })
  const authHintCookieMaxAge = hasPersistentSession && activeSession ? activeSession.maxAgeSeconds : null
  const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: authHintCookieMaxAge })

  setCookie(c, accessTokenCookie.key, accessTokenCookie.value, accessTokenCookie.options)
  setCookie(c, authHintCookie.key, authHintCookie.value, authHintCookie.options)
}

function getRemainingSeconds(expiresAt: Date, now: Date) {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000))
}

function isSessionExpired(session: Pick<RefreshSessionLookup, 'absoluteExpiresAt' | 'idleExpiresAt'>, now: Date) {
  return session.absoluteExpiresAt <= now || session.idleExpiresAt <= now
}

async function readActiveRefreshSession(refreshToken: string): Promise<ActiveRefreshSession | null> {
  const tokenHash = hashSessionToken(refreshToken)
  const session = await readRefreshSessionByTokenHash(tokenHash)

  if (!session) {
    return null
  }

  const now = new Date()

  if (session.revokedAt || session.rotatedAt || isSessionExpired(session, now)) {
    return null
  }

  return {
    userId: session.userId,
    maxAgeSeconds: getRemainingSeconds(session.idleExpiresAt, now),
  }
}

async function readRefreshSessionByTokenHash(tokenHash: string) {
  const [session] = await db
    .select({
      familyId: authSessionFamilyTable.id,
      userId: authSessionFamilyTable.userId,
      absoluteExpiresAt: authSessionFamilyTable.absoluteExpiresAt,
      idleExpiresAt: authSessionFamilyTable.idleExpiresAt,
      revokedAt: authSessionFamilyTable.revokedAt,
      rotatedAt: authSessionTokenTable.rotatedAt,
    })
    .from(authSessionTokenTable)
    .innerJoin(authSessionFamilyTable, eq(authSessionFamilyTable.id, authSessionTokenTable.familyId))
    .where(eq(authSessionTokenTable.tokenHash, tokenHash))

  return session ?? null
}
