import type { Context } from 'hono'

import { problemCode } from '@litomi/http/problem-details'

import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'
import { getCloudflareCountryCode } from '@/utils/request-country'

type AdultGateContextSource = Pick<Context, 'req'> & {
  get(key: string): unknown
}

export function adultVerificationRequiredResponse(c: Context): Response {
  return problemResponse(c, {
    status: 403,
    code: problemCode.ADULT_VERIFICATION_REQUIRED,
    detail: '성인인증이 필요해요',
    headers: { 'Cache-Control': privateCacheControl },
  })
}

export function isAdultVerificationRequiredForCountry(c: Pick<Context, 'req'>): boolean {
  const countryCode = getCloudflareCountryCode(c)
  return countryCode === undefined || ['KR', 'XX'].includes(countryCode)
}

export function shouldBlockAdultGate(c: AdultGateContextSource): boolean {
  const userIdRaw = c.get('userId')
  const userId = typeof userIdRaw === 'number' ? userIdRaw : undefined
  const isAdult = c.get('isAdult') === true

  return isAdultVerificationRequiredForCountry(c) && Boolean(userId) && isAdult === false
}
