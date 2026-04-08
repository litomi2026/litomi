import crypto from 'crypto'
import { and, desc, eq, gt, inArray, lt, or } from 'drizzle-orm'
import { userAgent as getUserAgent } from 'next/server'

import { MAX_TRUSTED_DEVICES_PER_USER } from '@/constants/policy'
import { db } from '@/database/supabase/drizzle'
import { trustedBrowserTable } from '@/database/supabase/two-factor'

import { TRUSTED_BROWSER_EXPIRY_DAYS } from './trusted-browser'

export async function registerTrustedBrowser(userId: number, fingerprint: string, userAgent: string) {
  const browserId = generateBrowserId(fingerprint)
  const browserName = parseBrowserName(userAgent)
  const expiresAt = new Date()

  expiresAt.setDate(expiresAt.getDate() + TRUSTED_BROWSER_EXPIRY_DAYS)

  await db.transaction(async (tx) => {
    const existingBrowsers = await tx
      .select({
        id: trustedBrowserTable.id,
        browserId: trustedBrowserTable.browserId,
      })
      .from(trustedBrowserTable)
      .where(eq(trustedBrowserTable.userId, userId))
      .orderBy(desc(trustedBrowserTable.lastUsedAt))

    const currentBrowser = existingBrowsers.find((browser) => browser.browserId === browserId)

    if (!currentBrowser && existingBrowsers.length >= MAX_TRUSTED_DEVICES_PER_USER) {
      const idsToDelete = existingBrowsers.slice(MAX_TRUSTED_DEVICES_PER_USER - 1).map((browser) => browser.id)

      if (idsToDelete.length > 0) {
        await tx
          .delete(trustedBrowserTable)
          .where(
            and(
              eq(trustedBrowserTable.userId, userId),
              or(inArray(trustedBrowserTable.id, idsToDelete), lt(trustedBrowserTable.expiresAt, new Date())),
            ),
          )
      }
    }

    await tx
      .insert(trustedBrowserTable)
      .values({
        userId,
        browserId,
        browserName,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [trustedBrowserTable.userId, trustedBrowserTable.browserId],
        set: {
          browserName,
          expiresAt,
          lastUsedAt: new Date(),
        },
      })
  })

  return browserId
}

export async function touchTrustedBrowserLastUsedAt(userId: number, browserId: string, now: Date) {
  const [browser] = await db
    .update(trustedBrowserTable)
    .set({ lastUsedAt: now })
    .where(
      and(
        eq(trustedBrowserTable.userId, userId),
        eq(trustedBrowserTable.browserId, browserId),
        gt(trustedBrowserTable.expiresAt, now),
      ),
    )
    .returning({ id: trustedBrowserTable.id })

  return Boolean(browser)
}

function generateBrowserId(fingerprint: string) {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()
  const combined = `${randomBytes}-${timestamp}-${fingerprint}`

  return crypto.createHash('sha256').update(combined).digest('hex')
}

function parseBrowserName(ua: string) {
  const agent = getUserAgent({ headers: new Headers({ 'user-agent': ua }) })
  const browser = agent.browser.name || 'Unknown Browser'
  const os = agent.os.name || 'Unknown OS'
  const device = agent.device.type || 'Desktop'

  return `${browser} on ${os} (${device})`
}
