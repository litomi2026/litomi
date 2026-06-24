import { type PATCHV1MePushSettingsResponse, patchV1MePushSettingsBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { pushSettingsTable } from '@litomi/db/app/notification'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.patch('/', zProblemValidator('json', patchV1MePushSettingsBodySchema), async (c) => {
  const userId = c.get('userId')!
  const settings = c.req.valid('json')
  const updateValues = { ...settings, updatedAt: new Date() }

  try {
    await db
      .insert(pushSettingsTable)
      .values({ userId, ...updateValues })
      .onConflictDoUpdate({
        target: pushSettingsTable.userId,
        set: updateValues,
      })

    return c.json<PATCHV1MePushSettingsResponse>({ message: '푸시 알림을 설정했어요' })
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '푸시 알림 설정 중 오류가 발생했어요' })
  }
})

export default route
