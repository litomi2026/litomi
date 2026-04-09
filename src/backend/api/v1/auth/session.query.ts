import crypto from 'crypto'
import { and, eq, isNull } from 'drizzle-orm'

import { insertSession, type SessionInsert, type SessionWriteExecutor } from '@/auth/session.query'
import { authSessionTable } from '@/database/supabase/auth'
import { db } from '@/database/supabase/drizzle'
import {
  type AuthCookieConfig,
  getAccessTokenCookieConfig,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@/utils/cookie'
import { sec } from '@/utils/format/date'

type IssueAuthCookiesInput = {
  adult: boolean
  ipAddress?: string | null
  remember: boolean
  tx?: SessionWriteExecutor
  userAgent?: string | null
  userId: number
}

const REFRESH_SESSION_ABSOLUTE_TTL_SECONDS = sec('30 days')
const REFRESH_SESSION_IDLE_TTL_SECONDS = sec('30 days')
const REFRESH_SESSION_TOKEN_BYTES = 32

type IssueRefreshSessionInput = {
  ipAddress?: string | null
  tx?: SessionWriteExecutor
  userAgent?: string | null
  userId: number
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('base64url')
}

export async function issueAuthCookies({
  userId,
  adult,
  remember,
  tx,
  ...metadata
}: IssueAuthCookiesInput): Promise<AuthCookieConfig[]> {
  const accessTokenCookie = await getAccessTokenCookieConfig({ userId, adult })

  if (!remember) {
    const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: accessTokenCookie.options.maxAge })
    return [accessTokenCookie, authHintCookie]
  }

  const issuedSession = await issueRefreshSession({ userId, tx, ...metadata })
  const authHintCookie = getAuthHintCookieConfig({ maxAgeSeconds: issuedSession.maxAgeSeconds })

  return [accessTokenCookie, issuedSession.cookie, authHintCookie]
}

export async function revokeCurrentSessionByTokenHash(tokenHash: string, now: Date) {
  await db
    .update(authSessionTable)
    .set({ revokedAt: now, lastUsedAt: now })
    .where(and(eq(authSessionTable.tokenHash, tokenHash), isNull(authSessionTable.revokedAt)))
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

async function issueRefreshSession({ userId, ipAddress, userAgent, tx }: IssueRefreshSessionInput) {
  const now = new Date()
  const absoluteExpiresAt = addSeconds(now, REFRESH_SESSION_ABSOLUTE_TTL_SECONDS)
  const idleExpiresAt = addSeconds(now, REFRESH_SESSION_IDLE_TTL_SECONDS)
  const sessionId = crypto.randomUUID()
  const familyId = crypto.randomUUID()
  const token = generateSessionToken()

  const session: SessionInsert = {
    id: sessionId,
    userId,
    familyId,
    tokenHash: hashToken(token),
    createdAt: now,
    lastUsedAt: now,
    absoluteExpiresAt,
    idleExpiresAt,
    userAgent: truncate(userAgent, 512),
    ipAddress: truncate(ipAddress, 64),
  }

  await insertSession(session, tx)

  return {
    id: sessionId,
    familyId,
    token,
    maxAgeSeconds: getRemainingSeconds(idleExpiresAt, now),
    cookie: getRefreshSessionCookieConfig({
      token,
      maxAgeSeconds: getRemainingSeconds(idleExpiresAt, now),
    }),
  }
}

function truncate(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null
  }

  return value.slice(0, maxLength)
}
