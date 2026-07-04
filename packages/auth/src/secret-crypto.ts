import crypto from 'node:crypto'

import { env } from './env.totp'

// 범용 secret 저장 암호화(AES-256-CBC, `iv:ciphertext` hex) — 정산 계좌번호처럼 조회 시
// 원문이 필요한 민감 문자열용. 키는 TOTP_ENCRYPTION_KEY를 공유한다(전용 키/KMS 분리는
// 규모가 커지면 도입).
const ALGORITHM = 'aes-256-cbc'
const KEY = Buffer.from(env.TOTP_ENCRYPTION_KEY, 'hex')

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(plain, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

export function decryptSecret(encrypted: string): string {
  const parts = encrypted.split(':')

  if (parts.length !== 2) {
    throw new Error('Invalid encrypted secret format')
  }

  const [ivHex, ciphertext] = parts
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'))

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
