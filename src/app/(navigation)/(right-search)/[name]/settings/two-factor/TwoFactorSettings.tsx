import { and, eq, isNull, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { CookieKey } from '@/constants/storage'
import { trustedBrowserTable, twoFactorBackupCodeTable, twoFactorTable } from '@/database/supabase/2fa-schema'
import { db } from '@/database/supabase/drizzle'
import { JWTType, verifyJWT } from '@/utils/jwt'
import { TrustedBrowserPayload } from '@/utils/trusted-browser'

import TwoFactorSettingsClient from './TwoFactorSettingsClient'
import { TwoFactorStatus } from './types'

type Props = {
  userId: number
}

export default async function TwoFactorSettings({ userId }: Props) {
  const cookieStore = await cookies()
  const trustedBrowserToken = cookieStore.get(CookieKey.TRUSTED_BROWSER_TOKEN)?.value
  const currentBrowserId = await verifyTrustedBrowserToken(trustedBrowserToken, userId)
  const status = await getTwoFactorStatus(userId, currentBrowserId)

  return <TwoFactorSettingsClient initialStatus={status} />
}

async function getTwoFactorStatus(userId: number, currentBrowserId: string | null) {
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
                'expiresAt', ${trustedBrowserTable.expiresAt},
                'isCurrentBrowser', ${trustedBrowserTable.browserId} = ${currentBrowserId}
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

async function verifyTrustedBrowserToken(token: string | undefined, userId: number) {
  if (!token) {
    return null
  }

  try {
    const tokenData = await verifyJWT<TrustedBrowserPayload>(token, JWTType.TRUSTED_BROWSER)
    if (tokenData && +tokenData.userId === userId) {
      return tokenData.sub
    }
    return null
  } catch {
    return null
  }
}
