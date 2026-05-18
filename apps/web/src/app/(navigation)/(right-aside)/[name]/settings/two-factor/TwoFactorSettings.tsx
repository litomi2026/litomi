import { JWTType, verifyJWT } from '@litomi/auth/jwt'
import { db } from '@litomi/db/database/app/drizzle'
import { trustedBrowserTable, twoFactorBackupCodeTable, twoFactorTable } from '@litomi/db/database/app/two-factor'
import { CookieKey } from '@litomi/domain/constants/storage'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import TwoFactorSettingsClient from './TwoFactorSettingsClient'
import { TwoFactorStatus } from './types'

type Props = {
  userId: number
}

type TrustedBrowserPayload = {
  sub: string
  userId: string
}

export default async function TwoFactorSettings({ userId }: Props) {
  const cookieStore = await cookies()
  const trustedBrowserToken = cookieStore.get(CookieKey.TRUSTED_BROWSER_TOKEN)?.value
  const currentBrowserId = await getCurrentTrustedBrowserId(trustedBrowserToken, userId)
  const status = await getTwoFactorStatus(userId, currentBrowserId)

  return <TwoFactorSettingsClient initialStatus={status} />
}

async function getCurrentTrustedBrowserId(token: string | undefined, userId: number) {
  if (!token) {
    return null
  }

  try {
    const payload = await verifyJWT<TrustedBrowserPayload>(token, JWTType.TRUSTED_BROWSER)

    if (!payload.sub || !payload.userId) {
      return null
    }

    return Number(payload.userId) === userId ? payload.sub : null
  } catch {
    return null
  }
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
              ) ORDER BY COALESCE(${trustedBrowserTable.lastUsedAt}, ${trustedBrowserTable.createdAt}) DESC,
                ${trustedBrowserTable.id} DESC
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
