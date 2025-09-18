import { and, eq, isNull, sql } from 'drizzle-orm'

import { db } from '@/database/supabase/drizzle'
import { trustedBrowserTable, twoFactorBackupCodeTable, twoFactorTable } from '@/database/supabase/schema'

import TwoFactorSettingsClient from './TwoFactorSettingsClient'
import { TwoFactorStatus } from './types'

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
      trustedBrowsers: sql<TwoFactorStatus['trustedBrowsers']>`
        COALESCE(
          (
            SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', ${trustedBrowserTable.id},
                'browserName', ${trustedBrowserTable.browserName},
                'lastUsedAt', ${trustedBrowserTable.lastUsedAt},
                'createdAt', ${trustedBrowserTable.createdAt},
                'expiresAt', ${trustedBrowserTable.expiresAt}
              ) ORDER BY ${trustedBrowserTable.lastUsedAt} DESC
            )
            FROM ${trustedBrowserTable}
            WHERE ${trustedBrowserTable.userId} = ${userId}
              AND ${trustedBrowserTable.expiresAt} > CURRENT_TIMESTAMP
          ),
          '[]'::json
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
