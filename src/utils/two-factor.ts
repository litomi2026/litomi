import crypto from 'crypto'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

import { TOTP_ISSUER } from '@/constants'
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
