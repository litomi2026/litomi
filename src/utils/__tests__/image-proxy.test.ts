import { describe, expect, test } from 'bun:test'

import {
  createImageProxyCacheKey,
  createImageProxyCanonicalSource,
  createImageProxyRequestURL,
} from '@/utils/image-proxy'

describe('image proxy cache key', () => {
  test('서명 쿼리가 달라도 같은 이미지면 동일한 캐시 키를 만든다', async () => {
    const signedURLA =
      'https://cdn.example.com/image/page-1.jpg?w=1200&h=1800&token=token-a&expires=1735689600&x-amz-signature=abc'
    const signedURLB =
      'https://cdn.example.com/image/page-1.jpg?h=1800&w=1200&token=token-b&expires=1739999999&x-amz-signature=def'

    const [keyA, keyB] = await Promise.all([createImageProxyCacheKey(signedURLA), createImageProxyCacheKey(signedURLB)])

    expect(keyA).toBe(keyB)
  })

  test('이미지 변형 파라미터가 달라지면 다른 캐시 키를 만든다', async () => {
    const sourceURLA = 'https://cdn.example.com/image/page-1.jpg?w=1080&h=1920&token=foo'
    const sourceURLB = 'https://cdn.example.com/image/page-1.jpg?w=720&h=1280&token=bar'

    const [keyA, keyB] = await Promise.all([createImageProxyCacheKey(sourceURLA), createImageProxyCacheKey(sourceURLB)])

    expect(keyA).not.toBe(keyB)
  })

  test('정규화 문자열에서 서명 파라미터를 제거한다', () => {
    const canonicalSource = createImageProxyCanonicalSource(
      'https://cdn.example.com/image/page-1.jpg?w=1200&token=abc&x-goog-signature=def&md5=hash-value&h=1800',
    )

    expect(canonicalSource).toBe('https://cdn.example.com/image/page-1.jpg?h=1800&w=1200')
  })

  test('내부 네트워크 주소는 거부한다', async () => {
    expect(createImageProxyCacheKey('https://127.0.0.1/private.jpg')).rejects.toThrow()
  })

  test('프록시 요청 URL을 /i/v1/<key>?u=<signed_url> 형태로 만든다', async () => {
    const sourceURL = 'https://cdn.example.com/image/page-1.jpg?w=1200&h=1800&token=abc'
    const requestURL = await createImageProxyRequestURL({
      proxyOrigin: 'https://img.litomi.in',
      sourceURL,
    })
    const parsedRequestURL = new URL(requestURL)

    expect(parsedRequestURL.origin).toBe('https://img.litomi.in')
    expect(parsedRequestURL.pathname).toMatch(/^\/i\/v1\/[a-f0-9]{64}$/)
    expect(parsedRequestURL.searchParams.get('u')).toBe(sourceURL)
  })
})
