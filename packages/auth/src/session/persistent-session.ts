import {
  type AuthCookieConfig,
  getAccessTokenCookieConfig,
  getAuthCookieClearConfigs,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@litomi/auth/cookie'
import 'server-only'
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
} from '@litomi/auth/session'
import { db } from '@litomi/db/app'
import crypto from 'crypto'

import {
  insertSessionFamily,
  insertSessionToken,
  markSessionTokenRotated,
  readAdultFlag,
  readSessionFamilyByIdForUpdate,
  readSessionTokenByHash,
  readSessionTokenById,
  revokeSessionFamilyById,
  type SessionFamilyRow,
  type SessionTokenRow,
  type SessionWriteExecutor,
  touchSessionFamily,
} from '../query/session'

export type RefreshSessionFailure = {
  cookies: AuthCookieConfig[]
  ok: false
  reason: RefreshSessionFailureReason
}

export type RefreshSessionSuccess = {
  cookies: AuthCookieConfig[]
  ok: true
  rotated: boolean
  userId: number
  adult: boolean
}

type IssuedRefreshToken = {
  id: string
  token: string
  tokenHash: string
}

type RefreshFailureInput = {
  ok: false
  reason: RefreshSessionFailureReason
}

type RefreshSessionFailureReason = 'expired' | 'invalid' | 'missing' | 'reused' | 'revoked'

type RefreshSessionResult = RefreshFailureInput | RefreshSuccessInput

type RefreshSuccessInput = {
  adult: boolean
  maxAgeSeconds: number
  ok: true
  refreshToken: string
  rotated: boolean
  userId: number
}

export async function issuePersistentSession(userId: number, deviceLabel?: string | null, tx?: SessionWriteExecutor) {
  const now = new Date()
  const familyId = crypto.randomUUID()
  const refreshToken = createRefreshToken(familyId)
  const absoluteExpiresAt = addSeconds(now, REFRESH_SESSION_ABSOLUTE_TTL_SECONDS)
  const idleExpiresAt = addSeconds(now, REFRESH_SESSION_IDLE_TTL_SECONDS)

  const values = {
    id: familyId,
    userId,
    createdAt: now,
    lastUsedAt: now,
    absoluteExpiresAt,
    idleExpiresAt,
    deviceLabel: truncateSessionMetadata(deviceLabel, SESSION_DEVICE_LABEL_MAX_LENGTH),
  }

  const tokenValues = {
    id: refreshToken.id,
    familyId,
    tokenHash: refreshToken.tokenHash,
    createdAt: now,
  }

  await insertSessionFamily(values, tx)
  await insertSessionToken(tokenValues, tx)

  return {
    familyId,
    token: refreshToken.token,
    maxAgeSeconds: getRemainingSeconds(idleExpiresAt, now),
  }
}

export async function refreshSession(
  refreshToken: string | null | undefined,
  deviceLabel?: string | null,
): Promise<RefreshSessionFailure | RefreshSessionSuccess> {
  if (!refreshToken) {
    return {
      ok: false,
      reason: 'missing',
      cookies: getAuthCookieClearConfigs(),
    }
  }

  const tokenHash = hashSessionToken(refreshToken)

  const result = await db.transaction(async (tx): Promise<RefreshSessionResult> => {
    const candidateToken = await readSessionTokenByHash(tx, tokenHash)

    if (!candidateToken) {
      return {
        ok: false,
        reason: 'invalid',
      }
    }

    // Take the first row lock on the session family so stale and current refreshes serialize by family.
    const family = await readSessionFamilyByIdForUpdate(tx, candidateToken.familyId)

    if (!family) {
      return {
        ok: false,
        reason: 'invalid',
      }
    }

    if (family.revokedAt) {
      return {
        ok: false,
        reason: 'revoked',
      }
    }

    const token = await readSessionTokenById(tx, candidateToken.id)

    if (!token) {
      return {
        ok: false,
        reason: 'invalid',
      }
    }

    const now = new Date()

    if (token.rotatedAt) {
      // NOTE: 재사용 유예 기간 동안만 부모 토큰을 써도 자식 토큰으로 복구될 수 있도록 허용해요
      if (!token.replacedByTokenId || isSessionFamilyExpired(family, now) || !isTokenWithinReuseGrace(token, now)) {
        await revokeSessionFamilyById(tx, family.id, now)

        return {
          ok: false,
          reason: 'reused',
        }
      }

      const replacement = await readSessionTokenById(tx, token.replacedByTokenId)

      if (!replacement || replacement.rotatedAt) {
        await revokeSessionFamilyById(tx, family.id, now)

        return {
          ok: false,
          reason: 'reused',
        }
      }

      const replacementToken = rebuildRefreshToken(replacement)

      if (!replacementToken) {
        await revokeSessionFamilyById(tx, family.id, now)

        return {
          ok: false,
          reason: 'reused',
        }
      }

      const adult = await readAdultFlag(tx, family.userId)

      return {
        adult,
        maxAgeSeconds: getRemainingSeconds(family.idleExpiresAt, now),
        ok: true,
        refreshToken: replacementToken,
        rotated: false,
        userId: family.userId,
      }
    }

    if (isSessionFamilyExpired(family, now)) {
      await revokeSessionFamilyById(tx, family.id, now)

      return {
        ok: false,
        reason: 'expired',
      }
    }

    const nextToken = createRefreshToken(family.id)
    const nextIdleExpiresAt = minDate(addSeconds(now, REFRESH_SESSION_IDLE_TTL_SECONDS), family.absoluteExpiresAt)

    const tokenValues = {
      id: nextToken.id,
      familyId: family.id,
      tokenHash: nextToken.tokenHash,
      createdAt: now,
    }

    await insertSessionToken(tokenValues, tx)

    await markSessionTokenRotated(tx, token.id, nextToken.id, now)

    await touchSessionFamily(tx, family.id, {
      idleExpiresAt: nextIdleExpiresAt,
      lastUsedAt: now,
      deviceLabel: truncateSessionMetadata(deviceLabel ?? family.deviceLabel, SESSION_DEVICE_LABEL_MAX_LENGTH),
    })

    const adult = await readAdultFlag(tx, family.userId)

    return {
      adult,
      maxAgeSeconds: getRemainingSeconds(nextIdleExpiresAt, now),
      ok: true,
      refreshToken: nextToken.token,
      rotated: true,
      userId: family.userId,
    }
  })

  if (!result.ok) {
    return {
      ...result,
      cookies: getAuthCookieClearConfigs(),
    }
  }

  return await buildRefreshSuccess(result)
}

async function buildRefreshSuccess({
  userId,
  adult,
  maxAgeSeconds,
  refreshToken,
  rotated,
}: RefreshSuccessInput): Promise<RefreshSessionSuccess> {
  const accessTokenCookie = await getAccessTokenCookieConfig({
    userId,
    adult,
  })

  const refreshTokenCookie = getRefreshSessionCookieConfig({
    token: refreshToken,
    maxAgeSeconds,
  })

  const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds })

  return {
    ok: true,
    rotated,
    userId,
    adult,
    cookies: [accessTokenCookie, refreshTokenCookie, authHintCookie],
  }
}

function createRefreshToken(familyId: string): IssuedRefreshToken {
  const tokenId = crypto.randomUUID()
  const token = generateSessionToken({ familyId, tokenId })

  return {
    id: tokenId,
    token,
    tokenHash: hashSessionToken(token),
  }
}

function isSessionFamilyExpired(family: Pick<SessionFamilyRow, 'absoluteExpiresAt' | 'idleExpiresAt'>, now: Date) {
  return family.absoluteExpiresAt <= now || family.idleExpiresAt <= now
}

function isTokenWithinReuseGrace(token: Pick<SessionTokenRow, 'rotatedAt'>, now: Date) {
  if (!token.rotatedAt) {
    return false
  }

  return addSeconds(token.rotatedAt, REFRESH_SESSION_REUSE_GRACE_SECONDS) >= now
}

function rebuildRefreshToken(token: Pick<SessionTokenRow, 'familyId' | 'id' | 'tokenHash'>) {
  const refreshToken = generateSessionToken({
    familyId: token.familyId,
    tokenId: token.id,
  })

  if (hashSessionToken(refreshToken) !== token.tokenHash) {
    return null
  }

  return refreshToken
}
