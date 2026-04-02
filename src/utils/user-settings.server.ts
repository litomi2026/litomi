import { eq } from 'drizzle-orm'
import 'server-only'

import { db } from '@/database/supabase/drizzle'
import { userSettingsTable, userTable } from '@/database/supabase/user'

import { resolveUserSettings, type UserSettings } from './user-settings'

export async function readUserSettings(userId: number): Promise<UserSettings> {
  const [row] = await db
    .select({
      historySyncEnabled: userSettingsTable.historySyncEnabled,
      adultVerifiedAdVisible: userSettingsTable.adultVerifiedAdVisible,
      autoDeletionDay: userSettingsTable.autoDeletionDay,

      // TODO(2026-04-02): 마이그레이션 후 fallbackAutoDeletionDay 컬럼 삭제
      fallbackAutoDeletionDay: userTable.autoDeletionDays,
    })
    .from(userTable)
    .leftJoin(userSettingsTable, eq(userSettingsTable.userId, userTable.id))
    .where(eq(userTable.id, userId))

  if (!row) {
    return resolveUserSettings()
  }

  return resolveUserSettings({
    historySyncEnabled: row.historySyncEnabled ?? undefined,
    adultVerifiedAdVisible: row.adultVerifiedAdVisible ?? undefined,

    // TODO(2026-04-02): 마이그레이션 후 fallbackAutoDeletionDay 컬럼 삭제
    autoDeletionDay: row.autoDeletionDay ?? row.fallbackAutoDeletionDay ?? undefined,
  })
}
