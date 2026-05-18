import {
  type AuthCookieConfig,
  getAccessTokenCookieConfig,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@litomi/auth/cookie'
import { type SessionWriteExecutor } from '@litomi/auth/query/session.query'
import { hashSessionToken } from '@litomi/auth/session'
import { issuePersistentSession } from '@litomi/auth/session/persistent-session'
import { authSessionFamilyTable, authSessionTokenTable } from '@litomi/db/database/app/auth'
import { db } from '@litomi/db/database/app/drizzle'
import { and, eq, isNull } from 'drizzle-orm'

type IssueAuthCookiesInput = {
  adult: boolean
  deviceLabel?: string | null
  remember: boolean
  tx?: SessionWriteExecutor
  userId: number
}

export const hashToken = hashSessionToken

export async function issueAuthCookies({
  userId,
  adult,
  remember,
  tx,
  deviceLabel,
}: IssueAuthCookiesInput): Promise<AuthCookieConfig[]> {
  const accessTokenCookie = await getAccessTokenCookieConfig({ userId, adult })

  if (!remember) {
    const authHintCookie = getAuthHintCookieConfig()
    return [accessTokenCookie, authHintCookie]
  }

  const issuedSession = await issuePersistentSession(userId, deviceLabel, tx)
  const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: issuedSession.maxAgeSeconds })

  const options = {
    token: issuedSession.token,
    maxAgeSeconds: issuedSession.maxAgeSeconds,
  }

  return [accessTokenCookie, getRefreshSessionCookieConfig(options), authHintCookie]
}

export async function revokeCurrentSessionByTokenHash(tokenHash: string, now: Date) {
  const [token] = await db
    .select({ familyId: authSessionTokenTable.familyId })
    .from(authSessionTokenTable)
    .where(eq(authSessionTokenTable.tokenHash, tokenHash))

  if (!token) {
    return
  }

  await db
    .update(authSessionFamilyTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionFamilyTable.id, token.familyId), isNull(authSessionFamilyTable.revokedAt)))
}
