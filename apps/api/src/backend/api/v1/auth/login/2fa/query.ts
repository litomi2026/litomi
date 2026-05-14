import { db } from '@litomi/db/database/supabase/drizzle'
import { trustedBrowserTable } from '@litomi/db/database/supabase/two-factor'
import { twoFactorBackupCodeTable, twoFactorTable } from '@litomi/db/database/supabase/two-factor'
import { MAX_TRUSTED_DEVICES_PER_USER } from '@litomi/domain/constants/policy'
import crypto from 'crypto'
import { and, desc, eq, gte, isNull, lt, notInArray, or } from 'drizzle-orm'
import { userAgent as getUserAgent } from 'next/server'

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

  await tx.delete(trustedBrowserTable).where(
    and(
      eq(trustedBrowserTable.userId, userId),
      or(
        lt(trustedBrowserTable.expiresAt, now),
        notInArray(
          trustedBrowserTable.id,
          tx
            .select({ id: trustedBrowserTable.id })
            .from(trustedBrowserTable)
            .where(and(eq(trustedBrowserTable.userId, userId), gte(trustedBrowserTable.expiresAt, now)))
            .orderBy(
              desc(trustedBrowserTable.lastUsedAt),
              desc(trustedBrowserTable.createdAt),
              desc(trustedBrowserTable.id),
            )
            .limit(MAX_TRUSTED_DEVICES_PER_USER),
        ),
      ),
    ),
  )

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
