import type { Context } from 'hono'

import { problemCode } from '@litomi/http/problem-details'

import { privateCacheControl } from '@/utils/cache-control'
import { problemResponse } from '@/utils/problem'

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

export function shouldBlockAdultGate(c: AdultGateContextSource): boolean {
  const country = getRequestCountry(c)
  const userIdRaw = c.get('userId')
  const userId = typeof userIdRaw === 'number' ? userIdRaw : undefined
  const isAdult = c.get('isAdult') === true

  return country === 'KR' && Boolean(userId) && isAdult === false
}

function getRequestCountry(c: Pick<Context, 'req'>): string {
  // https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-ipcountry
  return c.req.header('CF-IPCountry')?.trim().toUpperCase() ?? 'KR'
}
