import crypto from 'crypto'

let ipSequence = 10

export function createPkcePair() {
  const codeVerifier = `verifier-${crypto.randomUUID()}`
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  return { codeVerifier, codeChallenge }
}

export function nextIp() {
  ipSequence += 1
  return `203.0.113.${ipSequence}`
}
