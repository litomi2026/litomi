import { Context } from 'hono'
import { setCookie } from 'hono/cookie'

import type { AuthCookieConfig } from '@/utils/cookie'

import { Env } from '..'

export function applyAuthCookie(c: Context<Env>, cookieConfigs: readonly AuthCookieConfig[]) {
  for (const cookie of cookieConfigs) {
    setCookie(c, cookie.key, cookie.value, cookie.options)
  }
}
