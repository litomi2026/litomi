import { and, eq, gt } from 'drizzle-orm'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { CookieKey } from '@/constants/storage'
import { trustedBrowserTable } from '@/database/supabase/2fa-schema'
import { db } from '@/database/supabase/drizzle'
import { deleteCookie } from '@/utils/cookie'
import { JWTType, verifyJWT } from '@/utils/jwt'
import { TrustedBrowserPayload } from '@/utils/trusted-browser'

export async function checkTrustedBrowser(
  cookieStore: ReadonlyRequestCookies,
  expectedUserId: number,
  expectedFingerprint: string,
) {
  const token = cookieStore.get(CookieKey.TRUSTED_BROWSER_TOKEN)?.value

  if (!token) {
    return false
  }

  const tokenData = await verifyTrustedBrowserToken(token)

  if (!tokenData) {
    deleteCookie(cookieStore, CookieKey.TRUSTED_BROWSER_TOKEN)
    return false
  }

  if (tokenData.fingerprint !== expectedFingerprint) {
    deleteCookie(cookieStore, CookieKey.TRUSTED_BROWSER_TOKEN)
    return false
  }

  if (tokenData.userId !== expectedUserId) {
    deleteCookie(cookieStore, CookieKey.TRUSTED_BROWSER_TOKEN)
    return false
  }

  const [browser] = await db
    .update(trustedBrowserTable)
    .set({ lastUsedAt: new Date() })
    .where(
      and(
        eq(trustedBrowserTable.userId, tokenData.userId),
        eq(trustedBrowserTable.browserId, tokenData.browserId),
        gt(trustedBrowserTable.expiresAt, new Date()),
      ),
    )
    .returning({ id: trustedBrowserTable.id })

  if (!browser) {
    deleteCookie(cookieStore, CookieKey.TRUSTED_BROWSER_TOKEN)
    return false
  }

  return true
}

async function verifyTrustedBrowserToken(token: string) {
  try {
    const payload = await verifyJWT<TrustedBrowserPayload>(token, JWTType.TRUSTED_BROWSER)

    if (!payload.sub || !payload.userId || !payload.fingerprint) {
      return null
    }

    return {
      userId: Number(payload.userId),
      browserId: payload.sub,
      fingerprint: payload.fingerprint,
    }
  } catch {
    return null
  }
}
