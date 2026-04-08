import { JWTType, verifyJWT } from '@/utils/jwt'

type TrustedBrowserPayload = {
  sub: string
  userId: string
  fingerprint: string
}

type VerifiedTrustedBrowserToken = {
  browserId: string
  fingerprint: string
  userId: number
}

export async function verifyTrustedBrowserToken(
  token: string | undefined,
): Promise<VerifiedTrustedBrowserToken | null> {
  if (!token) {
    return null
  }

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
