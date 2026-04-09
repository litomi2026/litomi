import { describe, expect, test } from 'bun:test'

import { CookieKey } from '@/constants/storage'

import { getTrustedBrowserCookieConfig } from '../login/2fa/util'

describe('getTrustedBrowserCookieConfig', () => {
  test('trusted browser 쿠키를 루트 경로에 발급한다', () => {
    const config = getTrustedBrowserCookieConfig('trusted-browser-token')

    expect(config.key).toBe(CookieKey.TRUSTED_BROWSER_TOKEN)
    expect(config.value).toBe('trusted-browser-token')
    expect(config.options.path).toBe('/')
    expect(config.options.httpOnly).toBe(true)
    expect(config.options.sameSite).toBe('strict')
    expect(config.options.secure).toBe(true)
  })
})
