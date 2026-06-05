import { env } from '@litomi/env/server.common'

export const APP_ORIGIN = new URL(env.APP_ORIGIN).origin

export function isAllowedRequestOrigin(origin?: string) {
  return normalizeOrigin(origin) === APP_ORIGIN || process.env.NODE_ENV !== 'production'
}

function normalizeOrigin(origin?: string): string | null {
  if (!origin) {
    return null
  }

  try {
    return new URL(origin).origin
  } catch {
    return null
  }
}
