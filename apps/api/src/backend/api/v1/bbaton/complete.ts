import { isPostgresError } from '@litomi/db/database/error'
import 'server-only'
import { bbatonVerificationTable } from '@litomi/db/database/supabase/bbaton'
import { db } from '@litomi/db/database/supabase/drizzle'
import { Hono } from 'hono'
import { z } from 'zod'

import type { Env } from '@/backend/app'

import { requireAuth } from '@/backend/middleware/require-auth'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

import { exchangeAuthorizationCode, fetchBBatonProfile } from './lib'
import { reissueAuthCookies } from './query'
import { checkBBatonRateLimit } from './rate-limit'
import { consumeBBatonOAuthAttempt } from './state'
import { getBBatonRedirectURI, parseBirthYear } from './utils'

const completeSchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().regex(/^[0-9a-f]{64}$/),
})

const route = new Hono<Env>()

route.post('/', requireAuth, zProblemValidator('json', completeSchema), async (c) => {
  const userId = c.get('userId')!

  try {
    const rateLimit = await checkBBatonRateLimit('complete', userId)

    if (!rateLimit.allowed) {
      const minutes = Math.max(1, Math.ceil(rateLimit.retryAfterSeconds / 60))
      return problemResponse(c, {
        status: 429,
        detail: `너무 많은 인증 시도가 있었어요. ${minutes}분 후에 다시 시도해 주세요.`,
      })
    }

    const { code, state } = c.req.valid('json')
    const attempt = await consumeBBatonOAuthAttempt(state)

    if (!attempt) {
      return problemResponse(c, {
        status: 400,
        detail: '인증 시도가 만료됐어요. 다시 시도해 주세요.',
      })
    }

    if (attempt.userId !== userId) {
      return problemResponse(c, {
        status: 400,
        detail: '인증 시도가 만료됐어요. 다시 시도해 주세요.',
      })
    }

    const redirectURI = getBBatonRedirectURI()
    const { accessToken, tokenType } = await exchangeAuthorizationCode({ code, redirectURI })
    const profile = await fetchBBatonProfile(accessToken, tokenType)
    const now = new Date()
    const birthYear = parseBirthYear(profile.birthYear)
    const student = profile.student === 'Y'

    try {
      await db
        .insert(bbatonVerificationTable)
        .values({
          userId,
          bbatonUserId: profile.userId,
          adultFlag: profile.adultFlag === 'Y',
          birthYear,
          gender: profile.gender,
          income: profile.income,
          student,
          verifiedAt: now,
        })
        .onConflictDoUpdate({
          target: [bbatonVerificationTable.userId],
          set: {
            bbatonUserId: profile.userId,
            adultFlag: profile.adultFlag === 'Y',
            birthYear,
            gender: profile.gender,
            income: profile.income,
            student,
            verifiedAt: now,
          },
        })
    } catch (error) {
      if (isDuplicateBBatonUserId(error)) {
        return problemResponse(c, { status: 409, detail: '해당 비바톤 계정이 이미 다른 리토미 계정에 연결되어 있어요' })
      }

      console.error(error)

      return problemResponse(c, { status: 500, detail: '비바톤 인증 정보를 저장하지 못했어요' })
    }

    const adult = profile.adultFlag === 'Y'
    await reissueAuthCookies(c, { userId, adult })

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : ''

    if (message.startsWith('BBATON_')) {
      return problemResponse(c, { status: 502, detail: '비바톤 인증에 실패했어요' })
    }

    return problemResponse(c, { status: 500, detail: '비바톤 인증 정보를 저장하지 못했어요' })
  }
})

function isDuplicateBBatonUserId(error: unknown): boolean {
  return (
    isPostgresError(error) &&
    error.cause.code === '23505' &&
    error.cause.constraint_name === 'bbaton_verification_bbaton_user_id_unique'
  )
}

export default route
