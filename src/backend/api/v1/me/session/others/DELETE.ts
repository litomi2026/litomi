import { Hono } from 'hono'
import 'server-only'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'

import { revokeOtherSessionFamiliesByUserId } from '../query'
import { type DELETEV1MeSessionResponse, getCurrentSessionFamilyId } from '../shared'

const route = new Hono<Env>()

route.delete('/', async (c) => {
  const userId = c.get('userId')!
  const now = new Date()

  try {
    const currentFamilyId = await getCurrentSessionFamilyId(c, userId)

    await revokeOtherSessionFamiliesByUserId(userId, currentFamilyId, now)

    return c.json<DELETEV1MeSessionResponse>({
      clearedCurrentSession: false,
      message: currentFamilyId ? '다른 로그인 유지 세션을 모두 종료했어요' : '모든 로그인 유지 세션을 종료했어요',
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '세션 종료 중 오류가 발생했어요' })
  }
})

export default route
