import { eq, sql } from 'drizzle-orm'

import { redisClient } from '@/database/redis'
import { bookmarkTable } from '@/database/supabase/activity'
import { authSessionTokenTable } from '@/database/supabase/auth'
import { bbatonVerificationTable } from '@/database/supabase/bbaton'
import { db } from '@/database/supabase/drizzle'
import { userExpansionTable } from '@/database/supabase/points'
import { trustedBrowserTable, twoFactorTable } from '@/database/supabase/two-factor'
import { userSettingsTable, userTable } from '@/database/supabase/user'

import { getTestPasswordHash, TEST_LOGIN_PASSWORD } from './auth'

let uniqueUserSequence = 0

type SeedAdultVerificationInput = Partial<typeof bbatonVerificationTable.$inferInsert> & {
  userId: number
}

type SeedBookmarkInput = {
  createdAt?: Date
  mangaId: number
}

type SeedTwoFactorInput = Partial<typeof twoFactorTable.$inferInsert> & {
  userId: number
}

type SeedUserExpansionInput = Partial<typeof userExpansionTable.$inferInsert> & {
  amount: number
  type: number
  userId: number
}

type SeedUserInput = Partial<Omit<typeof userTable.$inferInsert, 'passwordHash'>> & {
  password?: string
  passwordHash?: string
}

type SeedUserSettingsInput = Partial<Omit<typeof userSettingsTable.$inferInsert, 'userId'>> & {
  userId: number
}

export async function assertBackendDatabaseReady() {
  try {
    await db.execute(sql`select 1 from "user" limit 1`)
  } catch (error) {
    throw new Error(
      `Backend integration database is not ready. Start docker compose, then run bun run test:backend:integration:setup. ${formatError(error)}`,
    )
  }
}

export async function assertBackendRedisReady() {
  try {
    await redisClient.ping()
  } catch (error) {
    throw new Error(`Backend integration Redis is not ready. Start docker compose. ${formatError(error)}`)
  }
}

export async function readSessionTokensForFamily(familyId: string) {
  return await db.select().from(authSessionTokenTable).where(eq(authSessionTokenTable.familyId, familyId))
}

export async function resetBackendDatabase() {
  await db.execute(sql.raw(TRUNCATE_PUBLIC_TABLES_SQL))
}

export async function resetBackendRedis() {
  await redisClient.flushdb()
}

export async function seedAdultVerification({ userId, ...overrides }: SeedAdultVerificationInput) {
  const [record] = await db
    .insert(bbatonVerificationTable)
    .values({
      userId,
      bbatonUserId: overrides.bbatonUserId ?? `bbaton-${userId}`,
      adultFlag: overrides.adultFlag ?? false,
      birthYear: overrides.birthYear ?? 20,
      gender: overrides.gender ?? 'M',
      income: overrides.income ?? 'unknown',
      student: overrides.student ?? false,
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
      ...(overrides.verifiedAt ? { verifiedAt: overrides.verifiedAt } : {}),
    })
    .returning()

  return record
}

export async function seedBookmark(userId: number, { mangaId, createdAt }: SeedBookmarkInput) {
  const [bookmark] = await db
    .insert(bookmarkTable)
    .values({
      userId,
      mangaId,
      ...(createdAt ? { createdAt } : {}),
    })
    .returning()

  return bookmark
}

export async function seedBookmarks(userId: number, bookmarks: readonly SeedBookmarkInput[]) {
  if (bookmarks.length === 0) {
    return []
  }

  return await db
    .insert(bookmarkTable)
    .values(
      bookmarks.map(({ mangaId, createdAt }) => ({
        userId,
        mangaId,
        ...(createdAt ? { createdAt } : {}),
      })),
    )
    .returning()
}

export async function seedTrustedBrowser(values: typeof trustedBrowserTable.$inferInsert) {
  const [record] = await db.insert(trustedBrowserTable).values(values).returning()
  return record
}

export async function seedTwoFactor({ userId, ...overrides }: SeedTwoFactorInput) {
  const [record] = await db
    .insert(twoFactorTable)
    .values({
      userId,
      secret: overrides.secret ?? 'test-totp-secret',
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
      ...(overrides.lastUsedAt ? { lastUsedAt: overrides.lastUsedAt } : {}),
      ...(overrides.expiresAt ? { expiresAt: overrides.expiresAt } : {}),
    })
    .returning()

  return record
}

export async function seedUser({ password = TEST_LOGIN_PASSWORD, passwordHash, ...overrides }: SeedUserInput = {}) {
  const unique = ++uniqueUserSequence

  const [user] = await db
    .insert(userTable)
    .values({
      loginId: overrides.loginId ?? `testuser${unique}`,
      name: overrides.name ?? `TestUser${unique}`,
      nickname: overrides.nickname ?? `Tester${unique}`,
      passwordHash: passwordHash ?? (await getTestPasswordHash(password)),
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
      ...(overrides.loginAt ? { loginAt: overrides.loginAt } : {}),
      ...(overrides.logoutAt ? { logoutAt: overrides.logoutAt } : {}),
      ...(overrides.imageURL !== undefined ? { imageURL: overrides.imageURL } : {}),
      ...(overrides.autoDeletionDays !== undefined ? { autoDeletionDays: overrides.autoDeletionDays } : {}),
    })
    .returning()

  return user
}

export async function seedUserExpansion({ userId, type, amount, ...overrides }: SeedUserExpansionInput) {
  const [record] = await db
    .insert(userExpansionTable)
    .values({
      userId,
      type,
      amount,
      ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
    })
    .returning()

  return record
}

export async function seedUserSettings({ userId, ...overrides }: SeedUserSettingsInput) {
  const [settings] = await db
    .insert(userSettingsTable)
    .values({
      userId,
      historySyncEnabled: overrides.historySyncEnabled ?? true,
      adultVerifiedAdVisible: overrides.adultVerifiedAdVisible ?? false,
      autoDeletionDay: overrides.autoDeletionDay ?? 180,
    })
    .returning()

  return settings
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

const TRUNCATE_PUBLIC_TABLES_SQL = `
DO $$
DECLARE
  truncate_sql text;
BEGIN
  SELECT
    'TRUNCATE TABLE ' || string_agg(format('%I.%I', schemaname, tablename), ', ') || ' RESTART IDENTITY CASCADE'
  INTO truncate_sql
  FROM pg_tables
  WHERE schemaname = 'public';

  IF truncate_sql IS NOT NULL THEN
    EXECUTE truncate_sql;
  END IF;
END $$;
`
