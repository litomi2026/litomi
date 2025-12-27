'use server'

import crypto from 'crypto'
import { and, desc, eq, inArray, lt, or } from 'drizzle-orm'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { userAgent as getUserAgent } from 'next/server'

import { COOKIE_DOMAIN } from '@/constants'
import { MAX_TRUSTED_DEVICES_PER_USER } from '@/constants/policy'
import { CookieKey } from '@/constants/storage'
import { db } from '@/database/supabase/drizzle'
import { trustedBrowserTable } from '@/database/supabase/two-factor'
import { sec } from '@/utils/date'
import { JWTType, signJWT } from '@/utils/jwt'

const TRUSTED_DEVICE_EXPIRY_DAYS = 30

export type TrustedBrowserPayload = {
  sub: string
  userId: string
  fingerprint: string
}

export async function createTrustedBrowserToken(userId: number, fingerprint: string, browserId: string) {
  return signJWT({ sub: browserId, userId: String(userId), fingerprint }, JWTType.TRUSTED_BROWSER)
}

export async function insertTrustedBrowser(userId: number, fingerprint: string, userAgent: string) {
  const browserId = generateBrowserId(fingerprint)
  const browserName = parseBrowserName(userAgent)

  await db.transaction(async (tx) => {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + TRUSTED_DEVICE_EXPIRY_DAYS)

    // Step 1: Get all existing browsers in a single query
    const existingBrowsers = await tx
      .select({
        id: trustedBrowserTable.id,
        browserId: trustedBrowserTable.browserId,
        lastUsedAt: trustedBrowserTable.lastUsedAt,
      })
      .from(trustedBrowserTable)
      .where(eq(trustedBrowserTable.userId, userId))
      .orderBy(desc(trustedBrowserTable.lastUsedAt))

    const currentBrowser = existingBrowsers.find((d) => d.browserId === browserId)

    // Step 2: Handle browser limit with a single bulk delete
    if (!currentBrowser && existingBrowsers.length >= MAX_TRUSTED_DEVICES_PER_USER) {
      const idsToDelete = existingBrowsers.slice(MAX_TRUSTED_DEVICES_PER_USER - 1).map((d) => d.id)

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

    // Step 3: Upsert the browser using PostgreSQL's ON CONFLICT
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

export async function setTrustedBrowserCookie(cookieStore: ReadonlyRequestCookies, token: string) {
  cookieStore.set(CookieKey.TRUSTED_BROWSER_TOKEN, token, {
    domain: COOKIE_DOMAIN,
    httpOnly: true,
    maxAge: sec(`${TRUSTED_DEVICE_EXPIRY_DAYS} days`),
    path: '/auth/login',
    sameSite: 'strict',
    secure: true,
  })
}

function generateBrowserId(fingerprint: string): string {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()
  const combined = `${randomBytes}-${timestamp}-${fingerprint}`

  return crypto.createHash('sha256').update(combined).digest('hex')
}

function parseBrowserName(ua: string): string {
  const agent = getUserAgent({ headers: new Headers({ 'user-agent': ua }) })
  const browser = agent.browser.name || 'Unknown Browser'
  const os = agent.os.name || 'Unknown OS'
  const device = agent.device.type || 'Desktop'

  return `${browser} on ${os} (${device})`
}
