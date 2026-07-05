import type { DELETEV1MeSessionResponse } from '@litomi/contracts'

import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

import { revokeOtherSessionFamiliesByUserId } from '../query'
import { getCurrentSessionFamilyId } from '../shared'

const route = new Hono<Env>()

route.delete('/', async (c) => {
  const userId = c.get('userId')!
  const now = new Date()

  try {
    const currentFamilyId = await getCurrentSessionFamilyId(c, userId)

    await revokeOtherSessionFamiliesByUserId(userId, currentFamilyId, now)

    return c.json({ clearedCurrentSession: false } satisfies DELETEV1MeSessionResponse)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500 })
  }
})

export default route
