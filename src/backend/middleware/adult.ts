import { createMiddleware } from 'hono/factory'

import { problemResponse } from '@/backend/utils/problem'

import type { Env } from '..'

export const requireAdult = createMiddleware<Env>(async (c, next) => {
  // https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-ipcountry
  const country = c.req.header('CF-IPCountry')?.trim().toUpperCase() ?? 'KR'
  if (country !== 'KR') {
    return await next()
  }

  // 성인인증은 로그인 유저 활동 제한 목적이므로, 비로그인 요청은 여기서 막지 않아요.
  const userId = c.get('userId')
  if (!userId) {
    return await next()
  }

  const isAdult = c.get('isAdult') === true
  if (isAdult) {
    return await next()
  }

  return problemResponse(c, {
    status: 403,
    code: 'adult-verification-required',
    detail: '성인 인증이 필요해요',
  })
})
