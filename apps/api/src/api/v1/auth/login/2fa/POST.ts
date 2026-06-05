import { verifyPKCEChallenge } from '@litomi/auth/pkce-server'
import { buildSessionDeviceLabel } from '@litomi/auth/session'
import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { verifyBackupCode } from '@litomi/auth/two-factor-backup-code'
import { postV1AuthLogin2FARequestSchema, type POSTV1AuthLogin2FAResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { getRequestIP, getRequestUserAgent } from '@litomi/http/request'
import { Hono } from 'hono'
import { setCookie } from 'hono/cookie'

import type { Env } from '@/app'

import { readAdultFlag, touchUserLoginAtAndReturnProfile } from '@/api/v1/auth/query'
import { issueAuthCookies } from '@/api/v1/auth/session.query'
import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { ensureAllowed, twoFactorIpLimiter, twoFactorUserLimiter } from '../shared'
import {
  deleteBackupCodeByHash,
  readActiveTwoFactorByUserId,
  readBackupCodeHashesByUserId,
  registerTrustedBrowser,
  touchTwoFactorLastUsedAt,
} from './query'
import { getTrustedBrowserCookieConfig, signTrustedBrowserToken } from './util'

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

const route = new Hono<Env>()

route.post('/', zProblemValidator('json', postV1AuthLogin2FARequestSchema), async (c) => {
  const { authorizationCode, codeVerifier, fingerprint, remember, token, trustBrowser } = c.req.valid('json')
  const challengeData = await verifyPKCEChallenge(authorizationCode, codeVerifier, fingerprint)

  if (!challengeData.valid) {
    return problemResponse(c, {
      status: 401,
      code: 'login-challenge-expired',
      detail: '인증이 만료됐어요. 새로고침 후 시도해 주세요.',
    })
  }

  const { userId } = challengeData
  const remoteIP = getRequestIP(c.req.raw.headers)
  const userAgent = getRequestUserAgent(c.req.raw.headers)

  const limitResult = await ensureAllowed([
    { limiter: twoFactorIpLimiter, identifier: remoteIP },
    { limiter: twoFactorUserLimiter, identifier: String(userId) },
  ])

  if (!limitResult.allowed) {
    return tooManyRequestsProblemResponse(c, limitResult.retryAfter)
  }

  try {
    const result = await db.transaction(async (tx) => {
      const twoFactor = await readActiveTwoFactorByUserId(tx, userId)

      if (!twoFactor) {
        return {
          ok: false,
          status: 401,
          code: 'login-challenge-expired',
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
