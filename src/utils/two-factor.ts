import { compare, hash } from 'bcrypt'
import crypto from 'crypto'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

import { SALT_ROUNDS, TOTP_ISSUER } from '@/constants'
import { env } from '@/env/server.next'

const { TOTP_ENCRYPTION_KEY } = env

const TOTP_CONFIG = {
  issuer: TOTP_ISSUER,
  algorithm: 'aes-256-cbc',
  key: Buffer.from(TOTP_ENCRYPTION_KEY, 'hex'),
}

/**
 * Decrypt a TOTP secret from storage
 */
export function decryptTOTPSecret(encryptedSecret: string): string {
  try {
    const parts = encryptedSecret.split(':')

    if (parts.length !== 2) {
      throw new Error('Invalid encrypted secret format')
    }

    const [ivHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(TOTP_CONFIG.algorithm, TOTP_CONFIG.key, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Failed to decrypt TOTP secret:', error)
    throw new Error('Failed to decrypt TOTP secret')
  }
}

/**
 * Encrypt a TOTP secret for storage
 * In production, you should use a proper key management service
 */
export function encryptTOTPSecret(secret: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(TOTP_CONFIG.algorithm, TOTP_CONFIG.key, iv)

    let encrypted = cipher.update(secret, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Failed to encrypt TOTP secret:', error)
    throw new Error('Failed to encrypt TOTP secret')
  }
}

/**
 * Generate multiple backup codes
 */
export async function generateBackupCodes(count: number = 10): Promise<{ codes: string[]; hashedCodes: string[] }> {
  const codes: string[] = []
  const hashedCodes: string[] = []

  for (let i = 0; i < count; i++) {
    const code = generateBackupCode()
    codes.push(code)
    const hashedCode = await hash(code.replace('-', ''), SALT_ROUNDS)
    hashedCodes.push(hashedCode)
  }

  return { codes, hashedCodes }
}

/**
 * Generate a QR code for the TOTP secret
 */
export async function generateQRCode(keyURI: string): Promise<string> {
  try {
    return await QRCode.toDataURL(keyURI, { width: 256 })
  } catch (error) {
    console.error('generateQRCode:', error)
    throw new Error('QR 코드 생성에 실패했어요')
  }
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(inputCode: string, hashedCode: string): Promise<boolean> {
  try {
    const normalizedCode = inputCode.replace('-', '')
    return await compare(normalizedCode, hashedCode)
  } catch {
    return false
  }
}

/**
 * Verify a TOTP token
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    authenticator.options = { window: 1 }
    return authenticator.verify({ secret, token })
  } catch {
    return false
  }
}

/**
 * Generate a single backup code in the format of XXXX-XXXX
 */
function generateBackupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[crypto.randomInt(0, chars.length)]
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
