import {
  getAccessTokenCookieConfig,
  getAuthCookieClearConfigs,
  getAuthHintCookieConfig,
  getRefreshSessionCookieConfig,
} from '@litomi/auth/cookie'
import { COOKIE_DOMAIN } from '@litomi/domain/constants'
import { CookieKey } from '@litomi/domain/constants/storage'
import { describe, expect, test } from 'bun:test'

describe('auth cookie configs', () => {
  test('access token cookie는 remember 여부와 상관없이 session cookie로 발급된다', async () => {
    const config = await getAccessTokenCookieConfig({ userId: 7, adult: true })
    const secondConfig = await getAccessTokenCookieConfig({ userId: 8, adult: false })

    expect(config.key).toBe(CookieKey.ACCESS_TOKEN)
    expect(config.options.domain).toBe(COOKIE_DOMAIN)
    expect(config.options.httpOnly).toBe(true)
    expect('maxAge' in config.options).toBe(false)
    expect('expires' in config.options).toBe(false)
    expect(config.options.path).toBe('/')
    expect(config.options.sameSite).toBe('strict')
    expect(config.options.secure).toBe(true)

    expect('maxAge' in secondConfig.options).toBe(false)
    expect('expires' in secondConfig.options).toBe(false)
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
