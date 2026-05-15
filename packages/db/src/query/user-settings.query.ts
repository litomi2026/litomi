import { db } from '@litomi/db/database/supabase/drizzle'
import 'server-only'
import { userSettingsTable, userTable } from '@litomi/db/database/supabase/user'
import { resolveUserSettings, type UserSettings } from '@litomi/domain/utils/user-settings'
import { eq } from 'drizzle-orm'

export async function readUserSettings(userId: number): Promise<UserSettings> {
  const [row] = await db
    .select({
      historySyncEnabled: userSettingsTable.historySyncEnabled,
      adultVerifiedAdVisible: userSettingsTable.adultVerifiedAdVisible,
      autoDeletionDay: userSettingsTable.autoDeletionDay,
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
    autoDeletionDay: row.autoDeletionDay ?? undefined,
  })
}
