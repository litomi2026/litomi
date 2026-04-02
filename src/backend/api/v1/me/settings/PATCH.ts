import { Hono } from 'hono'
import 'server-only'
import { z } from 'zod'

import { Env } from '@/backend'
import { privateCacheControl } from '@/backend/utils/cache-control'
import { problemResponse } from '@/backend/utils/problem'
import { zProblemValidator } from '@/backend/utils/validator'
import { db } from '@/database/supabase/drizzle'
import { userSettingsTable } from '@/database/supabase/user'
import { patchUserSettings, resolveUserSettings, type UserSettings } from '@/utils/user-settings'
import { readUserSettings } from '@/utils/user-settings.server'

const patchMySettingsSchema = z
  .object({
    historySyncEnabled: z.boolean().optional(),
    adultVerifiedAdVisible: z.boolean().optional(),
    autoDeletionDay: z.int().min(0).max(1500).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '변경할 설정을 선택해 주세요',
  })

export type PATCHV1MeSettingsBody = z.infer<typeof patchMySettingsSchema>

export type PATCHV1MeSettingsResponse = {
  settings: UserSettings
}

const route = new Hono<Env>()

route.patch('/', zProblemValidator('json', patchMySettingsSchema), async (c) => {
  const userId = c.get('userId')!
  const patch = c.req.valid('json')

  try {
    const currentSettings = await readUserSettings(userId)
    const nextSettings = patchUserSettings(currentSettings, patch)

    const [row] = await db
      .insert(userSettingsTable)
      .values({
        userId,
        historySyncEnabled: nextSettings.historySyncEnabled,
        adultVerifiedAdVisible: nextSettings.adultVerifiedAdVisible,
        autoDeletionDay: nextSettings.autoDeletionDay,
      })
      .onConflictDoUpdate({
        target: userSettingsTable.userId,
        set: {
          ...(patch.historySyncEnabled !== undefined && { historySyncEnabled: patch.historySyncEnabled }),
          ...(patch.adultVerifiedAdVisible !== undefined && { adultVerifiedAdVisible: patch.adultVerifiedAdVisible }),
          ...(patch.autoDeletionDay !== undefined && { autoDeletionDay: patch.autoDeletionDay }),
        },
      })
      .returning({
        historySyncEnabled: userSettingsTable.historySyncEnabled,
        adultVerifiedAdVisible: userSettingsTable.adultVerifiedAdVisible,
        autoDeletionDay: userSettingsTable.autoDeletionDay,
      })

    if (!row) {
      return problemResponse(c, { status: 500, detail: '설정을 저장하지 못했어요' })
    }

    return c.json<PATCHV1MeSettingsResponse>(
      { settings: resolveUserSettings(row) },
      { headers: { 'Cache-Control': privateCacheControl } },
    )
  } catch (error) {
    console.error(error)
    return problemResponse(c, { status: 500, detail: '설정을 저장하지 못했어요' })
  }
})

export default route
