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
import { buildSessionDeviceLabel } from '@/utils/session'
import { decryptTOTPSecret, verifyTOTPToken } from '@/utils/two-factor'
import { verifyBackupCode } from '@/utils/two-factor-backup-code'

import { ensureAllowed, twoFactorIpLimiter, twoFactorUserLimiter } from '../shared'
import {
  deleteBackupCodeByHash,
  readActiveTwoFactorByUserId,
  readBackupCodeHashesByUserId,
  registerTrustedBrowser,
  touchTwoFactorLastUsedAt,
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

type SuccessfulTokenVerification = Extract<TokenVerificationResult, { ok: true }>

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
          detail: '인증이 만료됐어요. 새로고침 후 시도해 주세요.',
        } as const
      }

      const isTOTPCode = token.length === 6
      let tokenVerification: SuccessfulTokenVerification

      if (isTOTPCode) {
        const secret = decryptTOTPSecret(twoFactor.secret)
        const verified = await verifyTOTPToken(token, secret)

        if (!verified) {
          return INVALID_TOKEN_RESPONSE
        }

        tokenVerification = {
          ok: true,
          isBackupCode: false,
          backupCodeCount: 0,
        }
      } else {
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

        tokenVerification = {
          ok: true,
          isBackupCode: true,
          backupCodeCount: verificationResults.length - 1,
        }
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
          const browserId = await registerTrustedBrowser(tx, userId, fingerprint, userAgent)
          trustedBrowserToken = await signTrustedBrowserToken({ browserId, userId, fingerprint })
        } catch (error) {
          console.error('trustedBrowser setup failed:', error)
        }
      }

      const cookieConfigs = await issueAuthCookies({
        userId,
        adult,
        remember,
        deviceLabel: remember ? buildSessionDeviceLabel(userAgent) : null,
        tx,
      })

      return {
        ok: true,
        user,
        isBackupCode: tokenVerification.isBackupCode,
        backupCodeCount: tokenVerification.backupCodeCount,
        adult,
        cookieConfigs,
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

    applyAuthCookie(c, result.cookieConfigs)

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
} as const
