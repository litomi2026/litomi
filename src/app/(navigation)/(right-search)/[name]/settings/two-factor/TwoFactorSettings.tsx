import { and, eq, isNull, sql } from 'drizzle-orm'

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
      createdAt: twoFactorTable.createdAt,
      lastUsedAt: twoFactorTable.lastUsedAt,
      remainingBackupCodes: sql<number>`
        COALESCE(
          (SELECT COUNT(${twoFactorBackupCodeTable.userId})
           FROM ${twoFactorBackupCodeTable}
           WHERE ${twoFactorBackupCodeTable.userId} = ${userId}),
          0
        )
      `,
    })
    .from(twoFactorTable)
    .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

  if (!result) {
    return null
  }

  return result
}
