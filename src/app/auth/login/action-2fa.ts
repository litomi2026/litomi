'use server'

import { captureException } from '@sentry/nextjs'
import { and, eq, isNull } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { BACKUP_CODE_PATTERN } from '@/constants/policy'
import { twoFactorBackupCodeTable, twoFactorTable } from '@/database/supabase/2fa-schema'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/schema'
import { badRequest, internalServerError, ok, tooManyRequests, unauthorized } from '@/utils/action-response'
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { verifyPKCEChallenge } from '@/utils/pkce-server'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'
import { decryptTOTPSecret, verifyBackupCode, verifyTOTPToken } from '@/utils/two-factor'

const verifyTwoFactorSchema = z.object({
  codeVerifier: z.string(),
  fingerprint: z.string(),
  remember: z.literal('on').nullable(),
  sessionId: z.string(),
  token: z.union([z.string().length(6).regex(/^\d+$/), z.string().length(9).regex(new RegExp(BACKUP_CODE_PATTERN))]),
  trustDevice: z.literal('on').nullable(),
})

const twoFactorLimiter = new RateLimiter(RateLimitPresets.strict())

export async function verifyTwoFactorLogin(formData: FormData) {
  const validation = verifyTwoFactorSchema.safeParse({
    codeVerifier: formData.get('codeVerifier'),
    fingerprint: formData.get('fingerprint'),
    sessionId: formData.get('sessionId'),
    remember: formData.get('remember'),
    token: formData.get('token'),
    trustDevice: formData.get('trustDevice'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { codeVerifier, fingerprint, remember, sessionId, token, trustDevice } = validation.data
  const challengeData = await verifyPKCEChallenge(sessionId, codeVerifier, fingerprint)

  if (!challengeData.valid) {
    return unauthorized('2단계 인증을 완료할 수 없어요', formData)
  }

  const { userId } = challengeData
  const { allowed, retryAfter } = await twoFactorLimiter.check(String(userId))

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 인증 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`)
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [twoFactor] = await tx
        .select()
        .from(twoFactorTable)
        .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

      if (!twoFactor) {
        return unauthorized('2단계 인증을 완료할 수 없어요', formData)
      }

      let verified = false
      let isBackupCode = false
      let remainingBackupCodes = 0

      if (token.length === 6) {
        try {
          const secret = decryptTOTPSecret(twoFactor.secret)
          verified = verifyTOTPToken(token, secret)
        } catch (decryptError) {
          console.error('Failed to decrypt TOTP secret. it might be due to key mismatch:', decryptError)
          return badRequest('2단계 인증 설정에 문제가 있어요. 관리자에게 문의해주세요.', formData)
        }
      } else if (token.length === 9) {
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
          remainingBackupCodes = verificationResults.length - 1
        }
      }

      if (!verified) {
        return unauthorized('2단계 인증을 완료할 수 없어요', formData)
      }

      await tx.update(twoFactorTable).set({ lastUsedAt: new Date() }).where(eq(twoFactorTable.userId, userId))

      // Security: Only trust device if:
      // 1. User explicitly requested it (trustDevice checkbox)
      // 2. NOT using a backup code (backup codes shouldn't establish trust)
      // 3. Device fingerprint is valid (not 'unknown')
      // 4. IP address is valid (not 'unknown')
      if (trustDevice && !isBackupCode) {
        // TODO: 신뢰하는 기기 구현하기 - LRU 알고리즘으로 최대 5개까지 유지하기
      }

      const [user] = await tx.update(userTable).set({ loginAt: new Date() }).where(eq(userTable.id, userId)).returning({
        id: userTable.id,
        loginId: userTable.loginId,
        name: userTable.name,
        lastLoginAt: userTable.loginAt,
        lastLogoutAt: userTable.logoutAt,
      })

      const cookieStore = await cookies()

      await Promise.all([
        setAccessTokenCookie(cookieStore, userId),
        remember && setRefreshTokenCookie(cookieStore, userId),
      ])

      if (isBackupCode) {
        const alertReasons = []
        alertReasons.push('백업 코드가 사용됐어요')

        if (remainingBackupCodes <= 2) {
          alertReasons.push(`남은 백업 코드: ${remainingBackupCodes}개`)
        }

        // sendSecurityAlert({
        //   userId,
        //   event: 'backup_code_used',
        //   details: {
        //     reasons: alertReasons,
        //     remainingBackupCodes,
        //   },
        // }).catch((error) => {
        //   console.error('Failed to send security alert:', error)
        // })
      }

      await twoFactorLimiter.reward(String(userId))

      return ok({
        ...user,
        isBackupCodeUsed: isBackupCode,
        remainingBackupCodes,
      })
    })

    return result
  } catch (error) {
    console.error('verifyTwoFactorLogin:', error)
    captureException(error, { extra: { name: 'verifyTwoFactorLogin', userId } })
    return internalServerError('2단계 인증 중 오류가 발생했어요', formData)
  }
}
