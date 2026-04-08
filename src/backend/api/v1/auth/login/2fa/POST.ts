import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'
import { z } from 'zod'

import { Env } from '@/backend'
import { readAdultFlag, touchUserLoginAtAndReturnProfile } from '@/backend/api/v1/auth/query'
import { issueAuthCookies } from '@/backend/api/v1/auth/session.query'
import { applyAuthCookie } from '@/backend/utils/cookie'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { BACKUP_CODE_PATTERN } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { verifyPKCEChallenge } from '@/utils/pkce-server'
import { getRequestIP, getRequestUserAgent } from '@/utils/request'
import { decryptTOTPSecret, verifyTOTPToken } from '@/utils/two-factor'
import { verifyBackupCode } from '@/utils/two-factor-backup-code'

import { ensureAllowed, twoFactorIpLimiter, twoFactorUserLimiter } from '../shared'
import {
  deleteBackupCodeByHash,
  readActiveTwoFactorByUserId,
  readBackupCodeHashesByUserId,
  registerTrustedBrowser,
  touchTwoFactorLastUsedAt,
  type TwoFactorTransaction,
} from './query'
import { getTrustedBrowserCookieConfig, signTrustedBrowserToken } from './util'

export type POSTV1AuthLogin2FARequest = {
  authorizationCode: string
  codeVerifier: string
  fingerprint: string
  remember: boolean
  token: string
  trustBrowser: boolean
}

export type POSTV1AuthLogin2FAResponse = {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
  isBackupCode: boolean
  backupCodeCount: number
}

type TokenVerificationResult =
  | {
      ok: false
      status: 400
      detail: string
    }
  | {
      ok: true
      isBackupCode: boolean
      backupCodeCount: number
    }

const verifyTwoFactorRequestSchema = z.object({
  codeVerifier: z.string().min(43).max(255),
  fingerprint: z.string().min(1).max(255),
  authorizationCode: z.string().min(1).max(255),
  remember: z.boolean().default(false),
  token: z.union([z.string().length(6).regex(/^\d+$/), z.string().length(9).regex(new RegExp(BACKUP_CODE_PATTERN))]),
  trustBrowser: z.boolean().default(false),
})

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', verifyTwoFactorRequestSchema), async (c) => {
  const { authorizationCode, codeVerifier, fingerprint, remember, token, trustBrowser } = c.req.valid('json')
  const challengeData = await verifyPKCEChallenge(authorizationCode, codeVerifier, fingerprint)

  if (!challengeData.valid) {
    return problemResponse(c, {
      status: 401,
      detail: '인증이 만료됐어요. 새로고침 후 시도해 주세요.',
    })
  }

  const { userId } = challengeData
  const remoteIP = getRequestIP(c.req.raw.headers)
  const userAgent = getRequestUserAgent(c.req.raw.headers)

  const limitResult = await ensureAllowed([
    twoFactorIpLimiter.check(remoteIP),
    twoFactorUserLimiter.check(String(userId)),
  ])

  if (!limitResult.allowed) {
    return problemResponse(c, {
      status: 429,
      detail: `너무 많은 인증 시도가 있었어요. ${limitResult.minutes}분 후에 다시 시도해 주세요.`,
      headers: { 'Retry-After': String(limitResult.retryAfter) },
    })
  }

  try {
    const result = await db.transaction(async (tx) => {
      const twoFactor = await readActiveTwoFactorByUserId(tx, userId)

      if (!twoFactor) {
        return {
          ok: false,
          status: 401,
          detail: '세션이 만료됐어요. 새로고침 후 시도해 주세요.',
        } as const
      }

      const tokenVerification =
        token.length === 6
          ? await verifyTotpLoginToken(twoFactor.secret, token)
          : await verifyBackupLoginToken(tx, userId, token)

      if (!tokenVerification.ok) {
        return tokenVerification
      }

      const now = new Date()

      const [adult, user] = await Promise.all([
        readAdultFlag(userId, tx),
        touchUserLoginAtAndReturnProfile(userId, now, tx),
        touchTwoFactorLastUsedAt(tx, userId, now),
      ])

      if (!user) {
        throw new Error(`User not found: ${userId}`)
      }

      let trustedBrowserToken: string | null = null

      if (trustBrowser && !tokenVerification.isBackupCode) {
        try {
          const browserId = await registerTrustedBrowser(userId, fingerprint, userAgent)
          trustedBrowserToken = await signTrustedBrowserToken({ browserId, userId, fingerprint })
        } catch (error) {
          console.error('trustedBrowser setup failed:', error)
        }
      }

      return {
        ok: true,
        user,
        isBackupCode: tokenVerification.isBackupCode,
        backupCodeCount: tokenVerification.backupCodeCount,
        adult,
        trustedBrowserToken,
      } as const
    })

    if (!result.ok) {
      return problemResponse(c, result)
    }

    if (result.trustedBrowserToken) {
      const trustedBrowserCookie = getTrustedBrowserCookieConfig(result.trustedBrowserToken)
      setCookie(c, trustedBrowserCookie.key, trustedBrowserCookie.value, trustedBrowserCookie.options)
    }

    const cookieConfigs = await issueAuthCookies({
      userId,
      adult: result.adult,
      remember,
      ipAddress: remoteIP,
      userAgent,
    })

    applyAuthCookie(c, cookieConfigs)

    await Promise.allSettled([twoFactorIpLimiter.reward(remoteIP), twoFactorUserLimiter.reward(String(userId))])

    return c.json<POSTV1AuthLogin2FAResponse>({
      ...result.user,
      isBackupCode: result.isBackupCode,
      backupCodeCount: result.backupCodeCount,
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '2단계 인증 중 오류가 발생했어요' })
  }
})

export default route

const INVALID_TOKEN_RESPONSE = {
  ok: false,
  status: 400,
  detail: '인증 코드를 확인해 주세요',
} as const satisfies TokenVerificationResult

const BROKEN_TOTP_RESPONSE = {
  ok: false,
  status: 400,
  detail: '2단계 인증에 문제가 있어요. 관리자에게 문의해 주세요.',
} as const satisfies TokenVerificationResult

const verifyTotpLoginToken = async (encryptedSecret: string, token: string): Promise<TokenVerificationResult> => {
  try {
    const secret = decryptTOTPSecret(encryptedSecret)
    const verified = await verifyTOTPToken(token, secret)

    return verified ? { ok: true, isBackupCode: false, backupCodeCount: 0 } : INVALID_TOKEN_RESPONSE
  } catch (error) {
    console.error('Failed to decrypt TOTP secret:', error)
    return BROKEN_TOTP_RESPONSE
  }
}

const verifyBackupLoginToken = async (
  tx: TwoFactorTransaction,
  userId: number,
  token: string,
): Promise<TokenVerificationResult> => {
  const backupCodes = await readBackupCodeHashesByUserId(tx, userId)

  const verificationResults = await Promise.all(
    backupCodes.map(async (backupCode) => ({
      codeHash: backupCode.codeHash,
      isValid: await verifyBackupCode(token, backupCode.codeHash),
    })),
  )

  const validCode = verificationResults.find((result) => result.isValid)

  if (!validCode) {
    return INVALID_TOKEN_RESPONSE
  }

  await deleteBackupCodeByHash(tx, userId, validCode.codeHash)

  return {
    ok: true,
    isBackupCode: true,
    backupCodeCount: verificationResults.length - 1,
  }
}
