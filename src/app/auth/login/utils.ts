import { and, eq, gt } from 'drizzle-orm'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'
import { db } from '@/database/supabase/drizzle'
import { trustedBrowserTable } from '@/database/supabase/two-factor'
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
    cookieStore.delete({
      name: CookieKey.TRUSTED_BROWSER_TOKEN,
      domain: COOKIE_DOMAIN,
      path: '/auth/login',
    })
    return false
  }

  if (tokenData.fingerprint !== expectedFingerprint) {
    cookieStore.delete({
      name: CookieKey.TRUSTED_BROWSER_TOKEN,
      domain: COOKIE_DOMAIN,
      path: '/auth/login',
    })
    return false
  }

  if (tokenData.userId !== expectedUserId) {
    cookieStore.delete({
      name: CookieKey.TRUSTED_BROWSER_TOKEN,
      domain: COOKIE_DOMAIN,
      path: '/auth/login',
    })
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
    cookieStore.delete({
      name: CookieKey.TRUSTED_BROWSER_TOKEN,
      domain: COOKIE_DOMAIN,
      path: '/auth/login',
    })
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
