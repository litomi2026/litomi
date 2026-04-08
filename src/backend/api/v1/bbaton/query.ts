import { createHash } from 'crypto'
import 'server-only'
import { eq } from 'drizzle-orm'
import { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'

import { Env } from '@/backend'
import { CookieKey } from '@/constants/storage'
import { authSessionTable } from '@/database/supabase/auth'
import { db } from '@/database/supabase/drizzle'
import { getAccessTokenCookieConfig, getAuthHintCookieConfig } from '@/utils/cookie'

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
  const { key: atKey, value: atValue, options: atOptions } = await getAccessTokenCookieConfig({ userId, adult })
  const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: atOptions.maxAge })

  setCookie(c, atKey, atValue, atOptions)
  setCookie(c, authHintCookie.key, authHintCookie.value, authHintCookie.options)

  const refreshToken = getCookie(c, CookieKey.REFRESH_TOKEN)
  if (!refreshToken) {
    return
  }

  const activeSession = await readActiveRefreshSession(refreshToken)
  if (!activeSession || activeSession.userId !== userId) {
    return
  }

  const longAuthHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: activeSession.maxAgeSeconds })
  setCookie(c, longAuthHintCookie.key, longAuthHintCookie.value, longAuthHintCookie.options)
}

function getRemainingSeconds(expiresAt: Date, now: Date) {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000))
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('base64url')
}

function isSessionExpired(session: Pick<RefreshSessionLookup, 'absoluteExpiresAt' | 'idleExpiresAt'>, now: Date) {
  return session.absoluteExpiresAt <= now || session.idleExpiresAt <= now
}

async function readActiveRefreshSession(refreshToken: string): Promise<ActiveRefreshSession | null> {
  const tokenHash = hashToken(refreshToken)
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
      userId: authSessionTable.userId,
      absoluteExpiresAt: authSessionTable.absoluteExpiresAt,
      idleExpiresAt: authSessionTable.idleExpiresAt,
      revokedAt: authSessionTable.revokedAt,
      rotatedAt: authSessionTable.rotatedAt,
    })
    .from(authSessionTable)
    .where(eq(authSessionTable.tokenHash, tokenHash))

  return session ?? null
}
