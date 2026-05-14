export interface PKCEChallenge {
  codeChallenge: string
  codeVerifier: string
  method: 'S256'
}

/**
 * Generate PKCE code verifier and challenge for OAuth 2.0/2FA flows
 * Implements RFC 7636 for enhanced security
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  const byteArray = new Uint8Array(64)
  crypto.getRandomValues(byteArray)
  const codeVerifier = byteArrayToBase64Url(byteArray)
  const codeChallenge = await generateSHA256Hash(codeVerifier)

  return {
    codeVerifier,
    codeChallenge,
    method: 'S256',
  }
}

/**
 * Convert ArrayBuffer to base64url string
 */
function byteArrayToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateSHA256Hash(text: string) {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashBytes = new Uint8Array(hashBuffer)
  return byteArrayToBase64Url(hashBytes)
}
