import { PROBLEM, postV1BBatonCompleteBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { bbatonVerificationTable } from '@litomi/db/app/bbaton'
import { isPostgresError } from '@litomi/db/error'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse, tooManyRequestsProblemResponse } from '@/utils/problem'
import { RedisRateLimiter } from '@/utils/rate-limit'
import { zProblemValidator } from '@/utils/validator'

import { exchangeAuthorizationCode, fetchBBatonProfile } from './lib'
import { reissueAuthCookies } from './query'
import { consumeBBatonOAuthAttempt } from './state'
import { BBATON_RATE_LIMIT, BBATON_RATE_LIMIT_WINDOW_SECONDS, getBBatonRedirectURI, parseBirthYear } from './utils'

const bbatonCompleteLimiter = new RedisRateLimiter({
  scope: 'bbaton:complete',
  limit: BBATON_RATE_LIMIT,
  windowSeconds: BBATON_RATE_LIMIT_WINDOW_SECONDS,
})

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('json', postV1BBatonCompleteBodySchema))

route.post('/', ...middlewares, async (c) => {
  const userId = c.get('userId')!

  try {
    const rateLimit = await bbatonCompleteLimiter.check(String(userId))

    if (!rateLimit.allowed) {
      return tooManyRequestsProblemResponse(c, rateLimit.retryAfter)
    }

    const { code, state } = c.req.valid('json')
    const attempt = await consumeBBatonOAuthAttempt(state)

    if (!attempt) {
      return problemResponse(c, { problem: PROBLEM.VERIFICATION_ATTEMPT_EXPIRED })
    }

    if (attempt.userId !== userId) {
      return problemResponse(c, { problem: PROBLEM.VERIFICATION_ATTEMPT_EXPIRED })
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
        return problemResponse(c, { problem: PROBLEM.BBATON_ALREADY_LINKED })
      }

      console.error(error)
      return problemResponse(c, { status: 500 })
    }

    const adult = profile.adultFlag === 'Y'
    await reissueAuthCookies(c, { userId, adult })

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : ''

    if (message.startsWith('BBATON_')) {
      return problemResponse(c, { status: 502 })
    }

    return problemResponse(c, { status: 500 })
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
