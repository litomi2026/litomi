import { db } from '@litomi/db/database/app/drizzle'
import { trustedBrowserTable, twoFactorTable } from '@litomi/db/database/app/two-factor'
import { userTable } from '@litomi/db/database/app/user'
import { and, eq, gt, isNull } from 'drizzle-orm'

export async function hasActiveTwoFactor(userId: number) {
  const [twoFactor] = await db
    .select({ enabled: twoFactorTable.userId })
    .from(twoFactorTable)
    .where(and(eq(twoFactorTable.userId, userId), isNull(twoFactorTable.expiresAt)))

  return Boolean(twoFactor)
}

export async function readLoginUserByLoginId(loginId: string) {
  const [user] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      passwordHash: userTable.passwordHash,
      lastLoginAt: userTable.loginAt,
      lastLogoutAt: userTable.logoutAt,
    })
    .from(userTable)
    .where(eq(userTable.loginId, loginId))

  return user ?? null
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
