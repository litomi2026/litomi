import { JWTType, signJWT } from '@litomi/auth/jwt'
import { COOKIE_DOMAIN } from '@litomi/domain/constants'
import { CookieKey } from '@litomi/domain/constants/storage'
import { sec } from '@litomi/std/format/date'

type SignTrustedBrowserTokenInput = {
  browserId: string
  fingerprint: string
  userId: number
}

export const TRUSTED_BROWSER_EXPIRY_DAYS = 30

export function getTrustedBrowserCookieConfig(token: string) {
  return {
    key: CookieKey.TRUSTED_BROWSER_TOKEN,
    value: token,
    options: {
      domain: COOKIE_DOMAIN,
      httpOnly: true,
      maxAge: sec(`${TRUSTED_BROWSER_EXPIRY_DAYS} days`),
      path: '/',
      sameSite: 'strict' as const,
      secure: true,
    },
  }
}

export async function signTrustedBrowserToken({ browserId, fingerprint, userId }: SignTrustedBrowserTokenInput) {
  return await signJWT({ sub: browserId, userId: String(userId), fingerprint }, JWTType.TRUSTED_BROWSER)
}
