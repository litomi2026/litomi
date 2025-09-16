'use server'

import { captureException } from '@sentry/nextjs'
import { z } from 'zod/v4'

import { badRequest, internalServerError, ok, tooManyRequests, unauthorized } from '@/utils/action-response'
import { flattenZodFieldErrors } from '@/utils/form-error'
import { verifyPKCEChallenge } from '@/utils/pkce-server'
import { RateLimiter, RateLimitPresets } from '@/utils/rate-limit'

const verifyTwoFactorSchema = z.object({
  codeChallenge: z.string(),
  fingerprint: z.string(),
  remember: z.literal('on').nullable(),
  sessionId: z.string(),
  token: z.string().min(6).max(9),
  trustDevice: z.literal('on').nullable(),
})

const twoFactorLimiter = new RateLimiter(RateLimitPresets.strict())

export async function verifyTwoFactorLogin(formData: FormData) {
  const validation = verifyTwoFactorSchema.safeParse({
    codeChallenge: formData.get('codeChallenge'),
    fingerprint: formData.get('fingerprint'),
    sessionId: formData.get('sessionId'),
    remember: formData.get('remember'),
    token: formData.get('token'),
    trustDevice: formData.get('trustDevice'),
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { codeChallenge, fingerprint, remember, sessionId, token, trustDevice } = validation.data

  const challengeData = await verifyPKCEChallenge(sessionId, codeChallenge, fingerprint)

  if (!challengeData.valid) {
    return unauthorized('2단계 인증을 완료할 수 없어요')
  }

  const { userId } = challengeData
  const { allowed, retryAfter } = await twoFactorLimiter.check(String(userId))

  if (!allowed) {
    const minutes = retryAfter ? Math.ceil(retryAfter / 60) : 1
    return tooManyRequests(`너무 많은 인증 시도가 있었어요. ${minutes}분 후에 다시 시도해주세요.`)
  }

  try {
    return ok({
      isBackupCodeUsed: false,
      remainingBackupCodes: 0,
      id: 0,
      loginId: '',
      name: '',
      lastLoginAt: null,
      lastLogoutAt: null,
    })
  } catch (error) {
    console.error('verifyTwoFactorLogin:', error)
    captureException(error, { extra: { name: 'verifyTwoFactorLogin', userId } })
    return internalServerError('2단계 인증 중 오류가 발생했어요', formData)
  }
}
