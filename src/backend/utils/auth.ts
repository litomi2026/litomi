import { Context } from 'hono'
import { deleteCookie } from 'hono/cookie'

import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'

import { Env } from '..'

export function clearAuthCookies(c: Context<Env>) {
  deleteCookie(c, CookieKey.ACCESS_TOKEN, { domain: COOKIE_DOMAIN })
  deleteCookie(c, CookieKey.REFRESH_TOKEN, { domain: COOKIE_DOMAIN })
  deleteCookie(c, CookieKey.AUTH_HINT, { domain: COOKIE_DOMAIN })
}
