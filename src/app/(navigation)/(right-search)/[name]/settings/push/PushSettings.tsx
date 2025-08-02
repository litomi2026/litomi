import { sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { pushSettingsTable } from '@/database/schema'

import PushSettingsForm from './PushSettingsForm'

type Props = {
  userId: string
}

export default async function PushSettings({ userId }: Props) {
  const settings = await getPushSettings(userId)

  return <PushSettingsForm initialSettings={settings} />
}

async function getPushSettings(userId: string) {
  const [settings] = await db
    .select({
      quietEnabled: pushSettingsTable.quietEnabled,
      quietStart: pushSettingsTable.quietStart,
      quietEnd: pushSettingsTable.quietEnd,
      batchEnabled: pushSettingsTable.batchEnabled,
      maxDaily: pushSettingsTable.maxDaily,
    })
    .from(pushSettingsTable)
    .where(sql`${pushSettingsTable.userId} = ${userId}`)

  if (!settings) {
    return {
      quietEnabled: true,
      quietStart: 22,
      quietEnd: 7,
      batchEnabled: true,
      maxDaily: 10,
    }
  }

  return settings
}
