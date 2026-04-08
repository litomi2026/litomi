import crypto from 'crypto'
import 'server-only'

import {
  insertSession,
  markSessionRotated,
  readAdultFlag,
  readSessionByIdForUpdate,
  readSessionByTokenHashForUpdate,
  revokeSessionById,
  revokeSessionFamily,
  type SessionRow,
} from '@/auth/session.query'
import { db } from '@/database/supabase/drizzle'
import {
  type AuthCookieConfig,
  getAccessTokenCookieConfig,
  getAuthCookieClearConfigs,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@/utils/cookie'
import { sec } from '@/utils/format/date'

const REFRESH_SESSION_IDLE_TTL_SECONDS = sec('30 days')
const REFRESH_SESSION_REUSE_GRACE_SECONDS = sec('5 seconds')
const REFRESH_SESSION_TOKEN_BYTES = 32

export type RefreshSessionFailure = {
  cookies: AuthCookieConfig[]
  ok: false
  reason: 'expired' | 'invalid' | 'missing' | 'reused' | 'revoked'
}

export type RefreshSessionSuccess = {
  cookies: AuthCookieConfig[]
  ok: true
  rotated: boolean
  userId: number
  adult: boolean
}

export type SessionMetadata = {
  ipAddress?: string | null
  userAgent?: string | null
}

export async function refreshSession(
  refreshToken: string | null | undefined,
  metadata: SessionMetadata = {},
): Promise<RefreshSessionFailure | RefreshSessionSuccess> {
  if (!refreshToken) {
    return {
      ok: false,
      reason: 'missing',
      cookies: getAuthCookieClearConfigs(),
    }
  }

  const tokenHash = hashToken(refreshToken)

  return await db.transaction(async (tx) => {
    const now = new Date()
    const session = await readSessionByTokenHashForUpdate(tx, tokenHash)

    if (!session) {
      return {
        ok: false,
        reason: 'invalid',
        cookies: getAuthCookieClearConfigs(),
      } satisfies RefreshSessionFailure
    }

    if (session.revokedAt) {
      return {
        ok: false,
        reason: 'revoked',
        cookies: getAuthCookieClearConfigs(),
      } satisfies RefreshSessionFailure
    }

    if (session.rotatedAt) {
      const withinGrace = now.getTime() - session.rotatedAt.getTime() <= REFRESH_SESSION_REUSE_GRACE_SECONDS * 1000

      if (withinGrace && session.replacedBySessionId) {
        const replacement = await readSessionByIdForUpdate(tx, session.replacedBySessionId)

        if (replacement && isSessionActive(replacement, now)) {
          const adult = await readAdultFlag(tx, replacement.userId)
          const accessTokenCookie = await getAccessTokenCookieConfig({ userId: replacement.userId, adult })
          const authHintCookie = getAuthHintCookieConfig({
            maxAgeSeconds: getRemainingSeconds(replacement.idleExpiresAt, now),
          })

          return {
            ok: true,
            rotated: false,
            userId: replacement.userId,
            adult,
            cookies: [accessTokenCookie, authHintCookie],
          } satisfies RefreshSessionSuccess
        }
      }

      await revokeSessionFamily(tx, session.familyId, now)

      return {
        ok: false,
        reason: 'reused',
        cookies: getAuthCookieClearConfigs(),
      } satisfies RefreshSessionFailure
    }

    if (isSessionExpired(session, now)) {
      await revokeSessionById(tx, session.id, now)

      return {
        ok: false,
        reason: 'expired',
        cookies: getAuthCookieClearConfigs(),
      } satisfies RefreshSessionFailure
    }

    const nextSessionId = crypto.randomUUID()
    const nextToken = generateSessionToken()
    const nextIdleExpiresAt = minDate(addSeconds(now, REFRESH_SESSION_IDLE_TTL_SECONDS), session.absoluteExpiresAt)

    const values = {
      id: nextSessionId,
      userId: session.userId,
      familyId: session.familyId,
      tokenHash: hashToken(nextToken),
      createdAt: now,
      lastUsedAt: now,
      absoluteExpiresAt: session.absoluteExpiresAt,
      idleExpiresAt: nextIdleExpiresAt,
      userAgent: truncate(metadata.userAgent ?? session.userAgent, 512),
      ipAddress: truncate(metadata.ipAddress ?? session.ipAddress, 64),
    }

    await insertSession(values, tx)
    await markSessionRotated(tx, session.id, nextSessionId, now)

    const adult = await readAdultFlag(tx, session.userId)
    const accessTokenCookie = await getAccessTokenCookieConfig({ userId: session.userId, adult })
    const refreshTokenCookie = getRefreshSessionCookieConfig({
      token: nextToken,
      maxAgeSeconds: getRemainingSeconds(nextIdleExpiresAt, now),
    })
    const authHintCookie = getAuthHintCookieConfig({
      maxAgeSeconds: getRemainingSeconds(nextIdleExpiresAt, now),
    })

    return {
      ok: true,
      rotated: true,
      userId: session.userId,
      adult,
      cookies: [accessTokenCookie, refreshTokenCookie, authHintCookie],
    } satisfies RefreshSessionSuccess
  })
}

function addSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000)
}

function generateSessionToken() {
  return crypto.randomBytes(REFRESH_SESSION_TOKEN_BYTES).toString('base64url')
}

function getRemainingSeconds(expiresAt: Date, now: Date) {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000))
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('base64url')
}

function isSessionActive(session: SessionRow, now: Date) {
  return !session.revokedAt && !session.rotatedAt && !isSessionExpired(session, now)
}

function isSessionExpired(session: Pick<SessionRow, 'absoluteExpiresAt' | 'idleExpiresAt'>, now: Date) {
  return session.absoluteExpiresAt <= now || session.idleExpiresAt <= now
}

function minDate(a: Date, b: Date) {
  return a.getTime() <= b.getTime() ? a : b
}

function truncate(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null
  }

  return value.slice(0, maxLength)
}
