import { createMiddleware } from 'hono/factory'

import { problemResponse } from '@/backend/utils/problem'

import type { Env } from '..'

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const userId = c.get('userId')

  if (!userId) {
    return problemResponse(c, { status: 401, detail: '로그인 정보가 없가나 만료됐어요' })
  }

  return await next()
})
