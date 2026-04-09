import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'

import { revokeSessionFamilyByIdForUser } from '../query'
import { type DELETEV1MeSessionResponse, getCurrentSessionFamilyId } from '../shared'

const sessionParamSchema = z.object({
  id: z.uuid(),
})

const route = new Hono<Env>()

route.delete('/', zProblemValidator('param', sessionParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id } = c.req.valid('param')
  const now = new Date()

  try {
    const currentFamilyId = await getCurrentSessionFamilyId(c, userId)

    if (currentFamilyId === id) {
      return problemResponse(c, { status: 400, detail: '현재 세션은 개별 종료할 수 없어요' })
    }

    const family = await revokeSessionFamilyByIdForUser(userId, id, now)

    if (!family) {
      return problemResponse(c, { status: 404, detail: '세션을 찾을 수 없어요' })
    }

    return c.json<DELETEV1MeSessionResponse>({
      clearedCurrentSession: false,
      message: '로그인 유지 세션을 종료했어요',
    })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '세션 종료 중 오류가 발생했어요' })
  }
})

export default route
