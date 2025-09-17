import { describe, expect, it } from 'bun:test'

import { generatePKCEChallenge } from './pkce-browser'

describe('PKCE with Web Crypto API', () => {
  it('should generate valid PKCE challenge and verifier', async () => {
    const pkce = await generatePKCEChallenge()

    expect(pkce).toBeDefined()
    expect(pkce.codeVerifier).toBeDefined()
    expect(pkce.codeChallenge).toBeDefined()
    expect(pkce.method).toBe('S256')

    // Verifier should be base64url encoded
    expect(pkce.codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/)
    // Challenge should be base64url encoded
    expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/)

    // Verifier should be 86 characters (64 bytes base64url encoded)
    expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(80)
    expect(pkce.codeVerifier.length).toBeLessThanOrEqual(90)

    // Challenge should be 43 characters (SHA-256 hash base64url encoded)
    expect(pkce.codeChallenge.length).toBe(43)
  })

  it('should generate different challenges for different verifiers', async () => {
    const pkce1 = await generatePKCEChallenge()
    const pkce2 = await generatePKCEChallenge()

    expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier)
    expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge)
  })
})
