import crypto from 'crypto'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { userAgent as getUserAgent } from 'next/server'

import { MAX_TRUSTED_DEVICES_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { trustedBrowserTable } from '@/database/supabase/two-factor'
import { twoFactorBackupCodeTable, twoFactorTable } from '@/database/supabase/two-factor'

import { TRUSTED_BROWSER_EXPIRY_DAYS } from './util'

export type TwoFactorTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function deleteBackupCodeByHash(tx: TwoFactorTransaction, userId: number, codeHash: string) {
  await tx
    .delete(twoFactorBackupCodeTable)
    .where(and(eq(twoFactorBackupCodeTable.userId, userId), eq(twoFactorBackupCodeTable.codeHash, codeHash)))
}

export async function readActiveTwoFactorByUserId(tx: TwoFactorTransaction, userId: number) {
  const [twoFactor] = await tx
    .select({ secret: twoFactorTable.secret })
    .from(twoFactorTable)
    .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

  return twoFactor ?? null
}

export async function readBackupCodeHashesByUserId(tx: TwoFactorTransaction, userId: number) {
  return await tx
    .select({ codeHash: twoFactorBackupCodeTable.codeHash })
    .from(twoFactorBackupCodeTable)
    .where(eq(twoFactorBackupCodeTable.userId, userId))
}

export async function registerTrustedBrowser(
  tx: TwoFactorTransaction,
  userId: number,
  fingerprint: string,
  userAgent: string,
) {
  const browserId = generateBrowserId(userId, fingerprint)
  const browserName = parseBrowserName(userAgent)
  const now = new Date()
  const expiresAt = new Date(now)

  expiresAt.setDate(expiresAt.getDate() + TRUSTED_BROWSER_EXPIRY_DAYS)

  // Keep the current browser slot plus the most recently used N-1 other browsers.
  await tx.execute(sql`
    DELETE FROM ${trustedBrowserTable}
    WHERE ${trustedBrowserTable.userId} = ${userId}
      AND (
        ${trustedBrowserTable.expiresAt} < ${now}
        OR ${trustedBrowserTable.id} IN (
          SELECT ${trustedBrowserTable.id}
          FROM ${trustedBrowserTable}
          WHERE ${trustedBrowserTable.userId} = ${userId}
            AND ${trustedBrowserTable.browserId} <> ${browserId}
            AND ${trustedBrowserTable.expiresAt} >= ${now}
          ORDER BY COALESCE(${trustedBrowserTable.lastUsedAt}, ${trustedBrowserTable.createdAt}) DESC,
            ${trustedBrowserTable.id} DESC
          OFFSET ${MAX_TRUSTED_DEVICES_PER_USER - 1}
        )
      )
  `)

  await tx
    .insert(trustedBrowserTable)
    .values({
      userId,
      browserId,
      browserName,
      expiresAt,
      lastUsedAt: now,
    })
    .onConflictDoUpdate({
      target: [trustedBrowserTable.userId, trustedBrowserTable.browserId],
      set: {
        browserName,
        expiresAt,
        lastUsedAt: now,
      },
    })

  return browserId
}

export async function touchTwoFactorLastUsedAt(tx: TwoFactorTransaction, userId: number, now: Date) {
  await tx.update(twoFactorTable).set({ lastUsedAt: now }).where(eq(twoFactorTable.userId, userId))
}

function generateBrowserId(userId: number, fingerprint: string) {
  return crypto.createHash('sha256').update(`${userId}:${fingerprint}`).digest('hex')
}

function parseBrowserName(ua: string) {
  const agent = getUserAgent({ headers: new Headers({ 'user-agent': ua }) })
  const browser = agent.browser.name || 'Unknown Browser'
  const os = agent.os.name || 'Unknown OS'
  const device = agent.device.type || 'Desktop'

  return `${browser} on ${os} (${device})`
}
