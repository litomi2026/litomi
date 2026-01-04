'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq, isNull } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { z } from 'zod'

import { BACKUP_CODE_PATTERN } from '@/constants/policy'
import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'
import { twoFactorBackupCodeTable, twoFactorTable } from '@/database/supabase/two-factor'
import { userTable } from '@/database/supabase/user'
import { badRequest, internalServerError, ok, tooManyRequests, unauthorized } from '@/utils/action-response'
import { getAccessTokenCookieConfig, getRefreshTokenCookieConfig } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { verifyPKCEChallenge } from '@/utils/pkce-server'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import { createTrustedBrowserToken, insertTrustedBrowser, setTrustedBrowserCookie } from '@/utils/trusted-browser'
import { decryptTOTPSecret, verifyTOTPToken } from '@/utils/two-factor'
import { verifyBackupCode } from '@/utils/two-factor-backup-code'

const verifyTwoFactorSchema = z.object({
  'code-verifier': z.string(),
  fingerprint: z.string(),
  remember: z.literal('on').nullable(),
  'authorization-code': z.string(),
  token: z.union([z.string().length(6).regex(/^\d+$/), z.string().length(9).regex(new RegExp(BACKUP_CODE_PATTERN))]),
  'trust-browser': z.literal('on').nullable(),
})

const twoFactorLimiter = new RateLimiter(RateLimitPresets.strict())

export async function verifyTwoFactorLogin(formData: FormData) {
  const validation = verifyTwoFactorSchema.safeParse({
    'code-verifier': formData.get('code-verifier'),
    fingerprint: formData.get('fingerprint'),
    'authorization-code': formData.get('authorization-code'),
    remember: formData.get('remember'),
    token: formData.get('token'),
    'trust-browser': formData.get('trust-browser'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { fingerprint, remember, token } = validation.data
  const codeVerifier = validation.data['code-verifier']
  const authorizationCode = validation.data['authorization-code']
  const trustBrowser = validation.data['trust-browser']
  const challengeData = await verifyPKCEChallenge(authorizationCode, codeVerifier, fingerprint)

  if (!challengeData.valid) {
    return unauthorized('세션이 만료됐어요. 새로고침 후 시도해 주세요.', formData)
  }

  const { userId } = challengeData
  const { allowed, retryAfter } = await twoFactorLimiter.check(String(userId))

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1

    // sendSecurityAlert({
    //   userId,
    //   event: 'multiple_failed_2fa',
    //   details: { failedAttempts: limit },
    // })

    return tooManyRequests(`너무 많은 인증 시도가 있었어요. ${minutes}분 후에 다시 시도해 주세요.`)
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [twoFactor] = await tx
        .select()
        .from(twoFactorTable)
        .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

      if (!twoFactor) {
        return unauthorized('세션이 만료됐어요. 새로고침 후 시도해 주세요.', formData)
      }

      let verified = false
      let isBackupCode = false
      let backupCodeCount = 0

      // TOTP token
      if (token.length === 6) {
        try {
          const secret = decryptTOTPSecret(twoFactor.secret)
          verified = verifyTOTPToken(token, secret)
        } catch (decryptError) {
          console.error('Failed to decrypt TOTP secret. It might be due to key mismatch:', decryptError)
          return badRequest('2단계 인증에 문제가 있어요. 관리자에게 문의해 주세요.', formData)
        }
      }
      // Backup code
      else if (token.length === 9) {
        const backupCodes = await tx
          .select({ codeHash: twoFactorBackupCodeTable.codeHash })
          .from(twoFactorBackupCodeTable)
          .where(eq(twoFactorBackupCodeTable.userId, userId))

        const verificationPromises = backupCodes.map(async (backupCode) => ({
          codeHash: backupCode.codeHash,
          isValid: await verifyBackupCode(token, backupCode.codeHash),
        }))

        const verificationResults = await Promise.all(verificationPromises)
        const validCode = verificationResults.find((result) => result.isValid)

        if (validCode) {
          await tx
            .delete(twoFactorBackupCodeTable)
            .where(
              and(
                eq(twoFactorBackupCodeTable.userId, userId),
                eq(twoFactorBackupCodeTable.codeHash, validCode.codeHash),
              ),
            )

          verified = true
          isBackupCode = true
          backupCodeCount = verificationResults.length - 1

          // sendSecurityAlert({
          //   userId,
          //   event: 'backup_code_used',
          //   details: { backupCodeCount },
          // })
        }
      }

      if (!verified) {
        return badRequest('인증 코드를 확인해 주세요', formData)
      }

      const [cookieStore, [user]] = await Promise.all([
        cookies(),
        tx
          .update(userTable)
          .set({
            loginAt: new Date(),
          })
          .where(eq(userTable.id, userId))
          .returning({
            id: userTable.id,
            loginId: userTable.loginId,
            name: userTable.name,
            lastLoginAt: userTable.loginAt,
            lastLogoutAt: userTable.logoutAt,
          }),
        tx
          .update(twoFactorTable)
          .set({
            lastUsedAt: new Date(),
          })
          .where(eq(twoFactorTable.userId, userId)),
      ])

      if (trustBrowser && !isBackupCode) {
        const headerList = await headers()
        const userAgent = headerList.get('user-agent') || headerList.get('sec-ch-ua') || 'unknown'

        try {
          const browserId = await insertTrustedBrowser(userId, fingerprint, userAgent)
          const token = await createTrustedBrowserToken(userId, fingerprint, browserId)
          await setTrustedBrowserCookie(cookieStore, token)
        } catch (error) {
          console.error('insertTrustedBrowser:', error)
        }

        // sendSecurityAlert({
        //   userId,
        //   event: 'new_trusted_browser',
        //   details: {
        //     browserName: userAgent,
        //     ipAddress: headerList.get('x-forwarded-for')?.split(',')[0].trim() || headerList.get('x-real-ip') || '',
        //   },
        // })
      }

      const [verification] = await tx
        .select({ adultFlag: bbatonVerificationTable.adultFlag })
        .from(bbatonVerificationTable)
        .where(eq(bbatonVerificationTable.userId, userId))

      const tokenClaims = {
        userId,
        adult: verification?.adultFlag === true,
      }

      const accessTokenCookie = await getAccessTokenCookieConfig(tokenClaims)
      cookieStore.set(accessTokenCookie.key, accessTokenCookie.value, accessTokenCookie.options)

      if (remember) {
        const refreshTokenCookie = await getRefreshTokenCookieConfig(tokenClaims)
        cookieStore.set(refreshTokenCookie.key, refreshTokenCookie.value, refreshTokenCookie.options)
      }

      await twoFactorLimiter.reward(String(userId))

      return ok({
        ...user,
        isBackupCode,
        backupCodeCount,
      })
    })

    return result
  } catch (error) {
    captureException(error, { extra: { name: 'verifyTwoFactorLogin', userId } })
    return internalServerError('2단계 인증 중 오류가 발생했어요', formData)
  }
}
