import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { sec } from '@/utils/format/date'

import { getDefaultSecureHeadersOptions } from '../middleware/secure-headers'

function createApp() {
  const app = new Hono()

  app.use('/api/*', secureHeaders(getDefaultSecureHeadersOptions()))
  app.get('/api/ping', (c) => c.json({ ok: true }))

  return app
}

describe('API 보안 헤더', () => {
  test('프로덕션 환경에서는 강화된 보안 헤더를 응답한다', async () => {
    const response = await createApp().request('http://localhost/api/ping')

    expect(response.headers.get('content-security-policy')).toBe(
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
    )
    expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin')
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin')
    expect(response.headers.get('origin-agent-cluster')).toBe('?1')
    expect(response.headers.get('permissions-policy')).toBe(
      'accelerometer=(), autoplay=(), browsing-topics=(), camera=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
    )
    expect(response.headers.get('referrer-policy')).toBe('no-referrer')
    expect(response.headers.get('strict-transport-security')).toBe(
      `max-age=${sec('2 years')}; includeSubDomains; preload`,
    )
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-dns-prefetch-control')).toBe('off')
    expect(response.headers.get('x-download-options')).toBe('noopen')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('x-permitted-cross-domain-policies')).toBe('none')
    expect(response.headers.get('x-powered-by')).toBeNull()
    expect(response.headers.get('x-xss-protection')).toBe('0')
  })
})
