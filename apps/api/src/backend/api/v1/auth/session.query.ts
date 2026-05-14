import { and, eq, isNull } from 'drizzle-orm'

import { issuePersistentSession } from '@/common/session'
import { authSessionFamilyTable, authSessionTokenTable } from '@/database/supabase/auth'
import { db } from '@/database/supabase/drizzle'
import { type SessionWriteExecutor } from '@/query/session.query'
import {
  type AuthCookieConfig,
  getAccessTokenCookieConfig,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@/utils/cookie'
import { hashSessionToken } from '@/utils/session'

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
