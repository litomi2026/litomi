import { describe, expect, test } from 'bun:test'

import { COOKIE_DOMAIN } from '@/constants'
import { CookieKey } from '@/constants/storage'

import {
  getAccessTokenCookieConfig,
  getAuthCookieClearConfigs,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '../cookie'

describe('auth cookie configs', () => {
  test('persistent access token cookie는 maxAge와 path를 포함한다', async () => {
    const config = await getAccessTokenCookieConfig({ userId: 7, adult: true })

    expect(config.key).toBe(CookieKey.ACCESS_TOKEN)
    expect(config.options.domain).toBe(COOKIE_DOMAIN)
    expect(config.options.httpOnly).toBe(true)
    expect(config.options.maxAge).toBe(60 * 60)
    expect(config.options.path).toBe('/')
    expect(config.options.sameSite).toBe('strict')
    expect(config.options.secure).toBe(true)
  })

  test('session access token cookie는 maxAge와 expires 없이 발급된다', async () => {
    const config = await getAccessTokenCookieConfig({ userId: 7, adult: false, persistent: false })

    expect(config.key).toBe(CookieKey.ACCESS_TOKEN)
    expect(config.options.domain).toBe(COOKIE_DOMAIN)
    expect(config.options.httpOnly).toBe(true)
    expect(config.options.maxAge).toBeUndefined()
    expect('expires' in config.options).toBe(false)
    expect(config.options.path).toBe('/')
  })

  test('auth hint cookie는 session/persistent 둘 다 지원한다', () => {
    const sessionCookie = getAuthHintCookieConfig()
    const persistentCookie = getAuthHintCookieConfig({ maxAgeSeconds: 1234 })

    expect(sessionCookie.key).toBe(CookieKey.AUTH_HINT)
    expect(sessionCookie.options.domain).toBe(COOKIE_DOMAIN)
    expect(sessionCookie.options.httpOnly).toBe(false)
    expect(sessionCookie.options.maxAge).toBeUndefined()
    expect('expires' in sessionCookie.options).toBe(false)
    expect(sessionCookie.options.path).toBe('/')

    expect(persistentCookie.options.maxAge).toBe(1234)
    expect(persistentCookie.options.path).toBe('/')
  })

  test('refresh session cookie는 domain과 path를 포함한다', () => {
    const config = getRefreshSessionCookieConfig({ token: 'refresh-token', maxAgeSeconds: 456 })

    expect(config.key).toBe(CookieKey.REFRESH_TOKEN)
    expect(config.options.domain).toBe(COOKIE_DOMAIN)
    expect(config.options.httpOnly).toBe(true)
    expect(config.options.maxAge).toBe(456)
    expect(config.options.path).toBe('/')
  })

  test('auth clear cookies는 domain/path를 유지한 채 즉시 만료된다', () => {
    const configs = getAuthCookieClearConfigs()

    expect(configs).toHaveLength(3)

    for (const config of configs) {
      expect(config.value).toBe('')
      expect(config.options.domain).toBe(COOKIE_DOMAIN)
      expect(config.options.maxAge).toBe(0)
      expect(config.options.expires?.getTime()).toBe(0)
      expect(config.options.path).toBe('/')
      expect(config.options.sameSite).toBe('strict')
      expect(config.options.secure).toBe(true)
    }
  })
})
