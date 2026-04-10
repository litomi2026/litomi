import crypto from 'crypto'
import 'server-only'

import { db } from '@/database/supabase/drizzle'
import {
  insertSessionFamily,
  insertSessionToken,
  markSessionTokenRotated,
  readAdultFlag,
  readSessionFamilyByIdForUpdate,
  readSessionTokenByHashForUpdate,
  readSessionTokenByIdForUpdate,
  revokeSessionFamilyById,
  type SessionFamilyRow,
  type SessionTokenRow,
  type SessionWriteExecutor,
  touchSessionFamily,
} from '@/query/session.query'
import {
  addSeconds,
  generateSessionToken,
  getRemainingSeconds,
  hashSessionToken,
  minDate,
  REFRESH_SESSION_ABSOLUTE_TTL_SECONDS,
  REFRESH_SESSION_IDLE_TTL_SECONDS,
  REFRESH_SESSION_REUSE_GRACE_SECONDS,
  SESSION_DEVICE_LABEL_MAX_LENGTH,
  truncateSessionMetadata,
} from '@/query/session.util'
import {
  type AuthCookieConfig,
  getAccessTokenCookieConfig,
  getAuthCookieClearConfigs,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@/utils/cookie'

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
  deviceLabel?: string | null
}

export async function issuePersistentSession(
  userId: number,
  metadata: SessionMetadata = {},
  tx?: SessionWriteExecutor,
) {
  const now = new Date()
  const familyId = crypto.randomUUID()
  const tokenId = crypto.randomUUID()
  const token = generateSessionToken()
  const absoluteExpiresAt = addSeconds(now, REFRESH_SESSION_ABSOLUTE_TTL_SECONDS)
  const idleExpiresAt = addSeconds(now, REFRESH_SESSION_IDLE_TTL_SECONDS)

  const values = {
    id: familyId,
    userId,
    createdAt: now,
    lastUsedAt: now,
    absoluteExpiresAt,
    idleExpiresAt,
    deviceLabel: truncateSessionMetadata(metadata.deviceLabel, SESSION_DEVICE_LABEL_MAX_LENGTH),
  }

  const tokenValues = {
    id: tokenId,
    familyId,
    tokenHash: hashSessionToken(token),
    createdAt: now,
  }

  await insertSessionFamily(values, tx)
  await insertSessionToken(tokenValues, tx)

  return {
    familyId,
    token,
    maxAgeSeconds: getRemainingSeconds(idleExpiresAt, now),
  }
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

  const tokenHash = hashSessionToken(refreshToken)

  return await db.transaction(async (tx) => {
    const now = new Date()
    const token = await readSessionTokenByHashForUpdate(tx, tokenHash)

    if (!token) {
      return {
        ok: false,
        reason: 'invalid',
        cookies: getAuthCookieClearConfigs(),
      } satisfies RefreshSessionFailure
    }

    const family = await readSessionFamilyByIdForUpdate(tx, token.familyId)

    if (!family) {
      return {
        ok: false,
        reason: 'invalid',
        cookies: getAuthCookieClearConfigs(),
      } satisfies RefreshSessionFailure
    }

    if (family.revokedAt) {
      return {
        ok: false,
        reason: 'revoked',
        cookies: getAuthCookieClearConfigs(),
      } satisfies RefreshSessionFailure
    }

    if (token.rotatedAt) {
      const withinGrace = now.getTime() - token.rotatedAt.getTime() <= REFRESH_SESSION_REUSE_GRACE_SECONDS * 1000

      if (withinGrace && token.replacedByTokenId) {
        const replacement = await readSessionTokenByIdForUpdate(tx, token.replacedByTokenId)

        if (replacement && isSessionTokenActive(replacement) && isSessionFamilyActive(family, now)) {
          const adult = await readAdultFlag(tx, family.userId)
          const accessTokenCookie = await getAccessTokenCookieConfig({ userId: family.userId, adult })
          const authHintCookie = getAuthHintCookieConfig({
            maxAgeSeconds: getRemainingSeconds(family.idleExpiresAt, now),
          })

          return {
            ok: true,
            rotated: false,
            userId: family.userId,
            adult,
            cookies: [accessTokenCookie, authHintCookie],
          } satisfies RefreshSessionSuccess
        }
      }

      await revokeSessionFamilyById(tx, family.id, now)

      return {
        ok: false,
        reason: 'reused',
        cookies: getAuthCookieClearConfigs(),
      } satisfies RefreshSessionFailure
    }

    if (isSessionFamilyExpired(family, now)) {
      await revokeSessionFamilyById(tx, family.id, now)

      return {
        ok: false,
        reason: 'expired',
        cookies: getAuthCookieClearConfigs(),
      } satisfies RefreshSessionFailure
    }

    const nextTokenId = crypto.randomUUID()
    const nextToken = generateSessionToken()
    const nextIdleExpiresAt = minDate(addSeconds(now, REFRESH_SESSION_IDLE_TTL_SECONDS), family.absoluteExpiresAt)

    await insertSessionToken(
      {
        id: nextTokenId,
        familyId: family.id,
        tokenHash: hashSessionToken(nextToken),
        createdAt: now,
      },
      tx,
    )
    await markSessionTokenRotated(tx, token.id, nextTokenId, now)
    await touchSessionFamily(tx, family.id, {
      idleExpiresAt: nextIdleExpiresAt,
      lastUsedAt: now,
      deviceLabel: truncateSessionMetadata(metadata.deviceLabel ?? family.deviceLabel, SESSION_DEVICE_LABEL_MAX_LENGTH),
    })

    const adult = await readAdultFlag(tx, family.userId)
    const accessTokenCookie = await getAccessTokenCookieConfig({ userId: family.userId, adult })
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
      userId: family.userId,
      adult,
      cookies: [accessTokenCookie, refreshTokenCookie, authHintCookie],
    } satisfies RefreshSessionSuccess
  })
}

function isSessionFamilyActive(family: SessionFamilyRow, now: Date) {
  return !family.revokedAt && !isSessionFamilyExpired(family, now)
}

function isSessionFamilyExpired(family: Pick<SessionFamilyRow, 'absoluteExpiresAt' | 'idleExpiresAt'>, now: Date) {
  return family.absoluteExpiresAt <= now || family.idleExpiresAt <= now
}

function isSessionTokenActive(token: SessionTokenRow) {
  return !token.rotatedAt
}
