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

export function getRequestCountry(c: Pick<Context, 'req'>): string {
  // https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-ipcountry
  return c.req.header('CF-IPCountry')?.trim().toUpperCase() ?? 'KR'
}

export function shouldBlockAdultGate(c: AdultGateContextSource): boolean {
  const country = getRequestCountry(c)
  const userIdRaw = c.get('userId')
  const userId = typeof userIdRaw === 'number' ? userIdRaw : undefined
  const isAdult = c.get('isAdult') === true

  // 성인인증은 로그인 유저 활동 제한 목적이므로, 비로그인 요청은 여기서 막지 않아요.
  return country === 'KR' && Boolean(userId) && isAdult === false
}
