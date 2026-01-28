import { env } from '@/env/server.hono'

const { CORS_ORIGIN } = env

export function resolveCORSOrigin(origin?: string) {
  if (!origin) {
    return undefined
  }

  if (origin === CORS_ORIGIN) {
    return origin
  }

  try {
    const corsOriginUrl = new URL(CORS_ORIGIN)
    const { hostname, protocol } = new URL(origin)
    const host = hostname.toLowerCase()

    if (host === 'localhost') {
      return origin
    }

    if ((host === 'litomi.in' || host.endsWith('.litomi.in')) && protocol === corsOriginUrl.protocol) {
      return origin
    }
  } catch {
    return undefined
  }

  return undefined
}
