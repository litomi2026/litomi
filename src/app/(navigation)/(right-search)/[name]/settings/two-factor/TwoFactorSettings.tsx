import { eq, sql } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { twoFactorBackupCodeTable, twoFactorTable } from '@/database/supabase/schema'

import TwoFactorSettingsClient from './TwoFactorSettingsClient'

type Props = {
  userId: number
}

export default async function TwoFactorSettings({ userId }: Props) {
  const status = await getTwoFactorStatus(userId)

  return <TwoFactorSettingsClient initialStatus={status} />
}

async function getTwoFactorStatus(userId: number) {
  const [result] = await db
    .select({
      enabled: twoFactorTable.enabled,
      createdAt: twoFactorTable.createdAt,
      lastUsedAt: twoFactorTable.lastUsedAt,
      remainingBackupCodes: sql<number>`
        COALESCE(
          (SELECT COUNT(*)::int
           FROM ${twoFactorBackupCodeTable}
           WHERE ${twoFactorBackupCodeTable.userId} = ${userId}
             AND ${twoFactorBackupCodeTable.usedAt} IS NULL),
          0
        )
      `,
    })
    .from(twoFactorTable)
    .where(eq(twoFactorTable.userId, userId))

  if (!result) {
    return null
  }

  return result
}
