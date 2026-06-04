import { env } from '@litomi/env/server.common'

const { APP_ORIGIN } = env

export function isAllowedRequestOrigin(origin?: string) {
  return origin === APP_ORIGIN || process.env.NODE_ENV !== 'production'
}
