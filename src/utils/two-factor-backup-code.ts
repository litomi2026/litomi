// NOTE: bcrypt 라이브러리를 gcr.io/distroless/base-nossl-debian12 이미지에서 사용할 수 없어서 분리함
import { compare, hash } from 'bcryptjs'
import crypto from 'crypto'

import { SALT_ROUNDS } from '@/constants'

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

export async function verifyBackupCode(inputCode: string, hashedCode: string): Promise<boolean> {
  try {
    const normalizedCode = inputCode.replace('-', '')
    return await compare(normalizedCode, hashedCode)
  } catch {
    return false
  }
}

function generateBackupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[crypto.randomInt(0, chars.length)]
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
