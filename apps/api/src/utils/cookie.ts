import type { AuthCookieConfig } from '@litomi/auth/cookie'

import type { Context } from 'hono'
import { setCookie } from 'hono/cookie'

import type { Env } from '../app'

export function applyAuthCookie(c: Context<Env>, cookieConfigs: readonly AuthCookieConfig[]) {
  for (const cookie of cookieConfigs) {
    setCookie(c, cookie.key, cookie.value, cookie.options)
  }
}
