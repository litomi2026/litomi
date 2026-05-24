import { getAuthCookieClearConfigs } from '@litomi/auth/cookie'
import { decryptTOTPSecret, verifyTOTPToken } from '@litomi/auth/two-factor'
import { patchV1MePasswordBodySchema, type PATCHV1MePasswordResponse } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { twoFactorTable } from '@litomi/db/app/two-factor'
import { userTable } from '@litomi/db/app/user'
import { SALT_ROUNDS } from '@litomi/domain/constants/security'
import { RateLimiter, RateLimitPresets } from '@litomi/http/rate-limit'
import { compare, hash } from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { applyAuthCookie } from '@/utils/cookie'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { revokeAllSessionsByUserId } from '../session/query'

const passwordChangeLimiter = new RateLimiter({
  ...RateLimitPresets.strict(),
  keyPrefix: 'rl:change-password:',
})

const route = new Hono<Env>()

route.patch('/', zProblemValidator('json', patchV1MePasswordBodySchema), async (c) => {
  const userId = c.get('userId')!
  const { currentPassword, newPassword, token } = c.req.valid('json')
  const { allowed, retryAfter } = await passwordChangeLimiter.check(String(userId))

  if (!allowed) {
    const seconds = retryAfter ?? 60
    const minutes = Math.max(1, Math.ceil(seconds / 60))

    return problemResponse(c, {
      status: 429,
      detail: `너무 많은 비밀번호 변경 시도가 있었어요. ${minutes}분 후에 다시 시도해 주세요.`,
      headers: { 'Retry-After': String(seconds) },
    })
  }

  if (currentPassword === newPassword) {
    return problemResponse(c, {
      status: 400,
      extensions: {
        invalidParams: [{ name: 'newPassword', reason: '현재 비밀번호와 새 비밀번호가 같아요' }],
      },
    })
  }

  const now = new Date()

  try {
    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .select({ passwordHash: userTable.passwordHash })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .for('update')

      if (!user) {
        return { kind: 'unauthorized' } as const
      }

      const isValidPassword = await compare(currentPassword, user.passwordHash).catch(() => false)

      if (!isValidPassword) {
        return { kind: 'verification-failed' } as const
      }

      const [twoFactor] = await tx
        .select({ secret: twoFactorTable.secret })
        .from(twoFactorTable)
        .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

      if (twoFactor) {
        if (!token) {
          return { kind: 'verification-failed' } as const
        }

        const secret = decryptTOTPSecret(twoFactor.secret)
        const isValidToken = await verifyTOTPToken(token, secret)

        if (!isValidToken) {
          return { kind: 'verification-failed' } as const
        }
      }

      const newPasswordHash = await hash(newPassword, SALT_ROUNDS)

      await tx
        .update(userTable)
        .set({
          passwordHash: newPasswordHash,
          loginAt: now,
        })
        .where(eq(userTable.id, userId))

      await revokeAllSessionsByUserId(userId, now, tx)

      return { kind: 'changed' } as const
    })

    switch (result.kind) {
      case 'changed':
        applyAuthCookie(c, getAuthCookieClearConfigs())
        await Promise.allSettled([passwordChangeLimiter.reward(String(userId))])

        return c.json<PATCHV1MePasswordResponse>({
          clearedCurrentSession: true,
          message: '비밀번호가 변경됐어요',
        })

      case 'unauthorized':
        applyAuthCookie(c, getAuthCookieClearConfigs())
        return problemResponse(c, { status: 401, detail: '로그인 정보가 없거나 만료됐어요' })

      case 'verification-failed':
        return problemResponse(c, {
          status: 400,
          detail: '현재 인증 정보를 확인해 주세요',
        })
    }
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '비밀번호 변경 중 오류가 발생했어요' })
  }
})

export default route
