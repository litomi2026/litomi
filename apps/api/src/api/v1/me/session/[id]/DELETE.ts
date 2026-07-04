import { type DELETEV1MeSessionResponse, deleteV1MeSessionParamSchema, PROBLEM } from '@litomi/contracts'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { revokeSessionFamilyByIdForUser } from '../query'
import { getCurrentSessionFamilyId } from '../shared'

const route = new Hono<Env>()

route.delete('/', zProblemValidator('param', deleteV1MeSessionParamSchema), async (c) => {
  const userId = c.get('userId')!
  const { id } = c.req.valid('param')
  const now = new Date()

  try {
    const currentFamilyId = await getCurrentSessionFamilyId(c, userId)

    if (currentFamilyId === id) {
      return problemResponse(c, { problem: PROBLEM.CURRENT_SESSION_NOT_REMOVABLE })
    }

    const family = await revokeSessionFamilyByIdForUser(userId, id, now)

    if (!family) {
      return problemResponse(c, { status: 404, detail: '기기 정보를 찾을 수 없어요' })
    }

    return c.json({ clearedCurrentSession: false } satisfies DELETEV1MeSessionResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
