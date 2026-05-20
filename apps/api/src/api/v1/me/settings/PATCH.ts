import { patchV1MeSettingsBodySchema } from '@litomi/contracts'
import { db } from '@litomi/db/app'
import { userSettingsTable } from '@litomi/db/app/user'
import { readUserSettings } from '@litomi/db/query/user-settings'
import { patchUserSettings } from '@litomi/domain/utils/user-settings'
import { Hono } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

const route = new Hono<Env>()

route.patch('/', zProblemValidator('json', patchV1MeSettingsBodySchema), async (c) => {
  const userId = c.get('userId')!
  const patch = c.req.valid('json')

  try {
    const currentSettings = await readUserSettings(userId)
    const nextSettings = patchUserSettings(currentSettings, patch)

    await db
      .insert(userSettingsTable)
      .values({
        userId,
        historySyncEnabled: nextSettings.historySyncEnabled,
        adultVerifiedAdVisible: nextSettings.adultVerifiedAdVisible,
        defaultCensorshipEnabled: nextSettings.defaultCensorshipEnabled,
        autoDeletionDay: nextSettings.autoDeletionDay,
      })
      .onConflictDoUpdate({
        target: userSettingsTable.userId,
        set: {
          ...(patch.historySyncEnabled !== undefined && { historySyncEnabled: patch.historySyncEnabled }),
          ...(patch.adultVerifiedAdVisible !== undefined && { adultVerifiedAdVisible: patch.adultVerifiedAdVisible }),
          ...(patch.defaultCensorshipEnabled !== undefined && {
            defaultCensorshipEnabled: patch.defaultCensorshipEnabled,
          }),
          ...(patch.autoDeletionDay !== undefined && { autoDeletionDay: patch.autoDeletionDay }),
        },
      })

    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '설정을 저장하지 못했어요' })
  }
})

export default route
