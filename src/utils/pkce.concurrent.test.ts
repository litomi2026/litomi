import { describe, expect, it } from 'bun:test'

import { generatePKCEChallenge } from './pkce-browser'

describe('Web Crypto API 기반 PKCE', () => {
  it('유효한 PKCE 챌린지와 검증 문자열을 생성한다', async () => {
    const pkce = await generatePKCEChallenge()

    expect(pkce).toBeDefined()
    expect(pkce.codeVerifier).toBeDefined()
    expect(pkce.codeChallenge).toBeDefined()
    expect(pkce.method).toBe('S256')

    // 검증 문자열은 base64url 형식이어야 한다.
    expect(pkce.codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/)
    // 챌린지는 base64url 형식이어야 한다.
    expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/)

    // 검증 문자열은 64바이트를 base64url로 인코딩한 길이여야 한다.
    expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(80)
    expect(pkce.codeVerifier.length).toBeLessThanOrEqual(90)

    // 챌린지는 SHA-256 해시를 base64url로 인코딩한 길이여야 한다.
    expect(pkce.codeChallenge.length).toBe(43)
  })

  it('서로 다른 검증 문자열에는 서로 다른 챌린지를 생성한다', async () => {
    const pkce1 = await generatePKCEChallenge()
    const pkce2 = await generatePKCEChallenge()

    expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier)
    expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge)
  })
})
