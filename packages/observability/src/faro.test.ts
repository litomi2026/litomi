import { describe, expect, test } from 'bun:test'

import { FARO_IGNORED_URLS } from './faro'

// Mirrors @opentelemetry/core `isUrlIgnored`: a string pattern matches by exact
// equality, a RegExp matches via String.prototype.match. This is exactly how the
// fetch/XHR instrumentation decides whether to skip a request.
function isIgnored(url: string): boolean {
  return FARO_IGNORED_URLS.some((pattern) =>
    typeof pattern === 'string' ? url === pattern : url.match(pattern) != null,
  )
}

describe('FARO_IGNORED_URLS', () => {
  test.each([
    'https://litomi.cc/api/v1/auth/signup',
    'https://litomi.cc/notification',
    'https://litomi.cc/api/v1/library/manga',
    'https://litomi.cc/api/v1/notification/unread-count',
    'https://proxy.litomi.cc/api/proxy/manga/123',
    'https://proxy.litomi.cc/api/proxy/k/new',
    'https://img.litomi.cc/api/health',
  ])('traces first-party request: %s', (url) => {
    expect(isIgnored(url)).toBe(false)
  })

  test.each([
    'https://faro-collector-prod-ap-northeast-0.grafana.net/collect/abc',
    'https://region1.analytics.google.com/g/collect?v=2',
    'https://www.google-analytics.com/g/collect',
    'https://api-kh.hiyobi.org/api/list',
    'https://khentai-6-7.siam-cdn.net/storage/49/x.webp',
    'https://ehgt.org/x.jpg',
    'https://xapi.juicyads.com/x',
    'https://m1.openfpcdn.io/v3/x',
    'https://litomi.cc.evil.com/steal', // spoofed host must not be treated as first-party
    'https://notlitomi.cc/x', // lookalike host must not be treated as first-party
    'http://localhost:3000/api/v1/x', // dev origin: not exported locally, and stray prod localhost probes are noise
    'http://127.0.0.1:3000/api/v1/x',
  ])('ignores third-party request: %s', (url) => {
    expect(isIgnored(url)).toBe(true)
  })

  test.each([
    'https://img.litomi.cc/i/v2/manga/3969470/original/16.webp?u=https%3A%2F%2Fcdn%2Fx',
    'https://litomi.cc/i/v2/manga/123/original/1.webp',
  ])('ignores first-party image-proxy read: %s', (url) => {
    expect(isIgnored(url)).toBe(true)
  })
})
