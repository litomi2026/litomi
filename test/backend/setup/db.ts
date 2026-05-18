import { encryptTOTPSecret } from '@litomi/auth/two-factor'
import { generateBackupCodes } from '@litomi/auth/two-factor-backup-code'
import { bookmarkTable } from '@litomi/db/database/app/activity'
import { authSessionFamilyTable, authSessionTokenTable } from '@litomi/db/database/app/auth'
import { bbatonVerificationTable } from '@litomi/db/database/app/bbaton'
import { db } from '@litomi/db/database/app/drizzle'
import { credentialTable } from '@litomi/db/database/app/passkey'
import { userExpansionTable } from '@litomi/db/database/app/points'
import { postTable } from '@litomi/db/database/app/post'
import { trustedBrowserTable, twoFactorBackupCodeTable, twoFactorTable } from '@litomi/db/database/app/two-factor'
import { userFollowTable, userSettingsTable, userTable } from '@litomi/db/database/app/user'
import { redisClient } from '@litomi/db/database/redis'
import { DeviceType } from '@litomi/domain/database/enum'
import { eq, sql } from 'drizzle-orm'

import { getTestPasswordHash, TEST_LOGIN_PASSWORD } from './auth'

let uniqueUserSequence = 0
let uniquePasskeyCredentialSequence = 0

export const TEST_TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'

type SeedAdultVerificationInput = Partial<typeof bbatonVerificationTable.$inferInsert> & {
  userId: number
}

type SeedBookmarkInput = {
  createdAt?: Date
  mangaId: number
}

type SeedPasskeyCredentialInput = Partial<
  Omit<typeof credentialTable.$inferInsert, 'credentialId' | 'publicKey' | 'userId'>
> & {
  credentialId?: string
  publicKey?: string
  userId: number
}

type SeedPostInput = Omit<typeof postTable.$inferInsert, 'userId'> & {
  userId: number
}

type SeedTwoFactorInput = Partial<typeof twoFactorTable.$inferInsert> & {
  encryptedSecret?: string
  secret?: string
  userId: number
}

type SeedUserExpansionInput = Partial<typeof userExpansionTable.$inferInsert> & {
  amount: number
  type: number
  userId: number
}

type SeedUserFollowInput = {
  createdAt?: Date
  followeeId: number
  followerId: number
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

export async function expireTwoFactor(userId: number, expiresAt: Date = new Date()) {
  const [twoFactor] = await db
    .update(twoFactorTable)
    .set({ expiresAt })
    .where(eq(twoFactorTable.userId, userId))
    .returning()

  return twoFactor ?? null
}

export async function readPasskeyCredentialByCredentialId(credentialId: string) {
  const [credential] = await db.select().from(credentialTable).where(eq(credentialTable.credentialId, credentialId))
  return credential ?? null
}

export async function readSessionFamiliesForUser(userId: number) {
  return await db.select().from(authSessionFamilyTable).where(eq(authSessionFamilyTable.userId, userId))
}

export async function readSessionTokensForFamily(familyId: string) {
  return await db.select().from(authSessionTokenTable).where(eq(authSessionTokenTable.familyId, familyId))
}

export async function readTrustedBrowsersForUser(userId: number) {
  return await db.select().from(trustedBrowserTable).where(eq(trustedBrowserTable.userId, userId))
}

export async function readTwoFactorBackupCodes(userId: number) {
  return await db.select().from(twoFactorBackupCodeTable).where(eq(twoFactorBackupCodeTable.userId, userId))
}

export async function readTwoFactorByUserId(userId: number) {
  const [twoFactor] = await db.select().from(twoFactorTable).where(eq(twoFactorTable.userId, userId))
  return twoFactor ?? null
}

export async function readUserById(userId: number) {
  const [user] = await db.select().from(userTable).where(eq(userTable.id, userId))
  return user ?? null
}

export async function readUserByLoginId(loginId: string) {
  const [user] = await db.select().from(userTable).where(eq(userTable.loginId, loginId))
  return user ?? null
}

export async function readUserFollowingIds(userId: number) {
  const rows = await db
    .select({ userId: userFollowTable.followeeId })
    .from(userFollowTable)
    .where(eq(userFollowTable.followerId, userId))

  return rows.map(({ userId: followeeId }) => followeeId)
}

export async function readUserSettingsByUserId(userId: number) {
  const [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId))
  return settings ?? null
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
      ...(overrides.createdAt && { createdAt: overrides.createdAt }),
      ...(overrides.verifiedAt && { verifiedAt: overrides.verifiedAt }),
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
      ...(createdAt && { createdAt }),
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
        ...(createdAt && { createdAt }),
      })),
    )
    .returning()
}

export async function seedPasskeyCredential({
  userId,
  credentialId,
  publicKey,
  ...overrides
}: SeedPasskeyCredentialInput) {
  const unique = ++uniquePasskeyCredentialSequence

  const [credential] = await db
    .insert(credentialTable)
    .values({
      userId,
      ...(overrides.id !== undefined && { id: overrides.id }),
      credentialId: credentialId ?? `test-passkey-credential-${unique}`,
      publicKey: publicKey ?? Buffer.from(`test-passkey-public-key-${unique}`).toString('base64'),
      counter: overrides.counter ?? 0,
      deviceType: overrides.deviceType ?? DeviceType.PLATFORM,
      transports: overrides.transports ?? ['internal'],
      ...(overrides.createdAt && { createdAt: overrides.createdAt }),
      ...(overrides.lastUsedAt && { lastUsedAt: overrides.lastUsedAt }),
    })
    .returning()

  return credential
}

export async function seedPost({ userId, ...overrides }: SeedPostInput) {
  const [post] = await db
    .insert(postTable)
    .values({
      userId,
      ...overrides,
    })
    .returning()

  return post
}

export async function seedTrustedBrowser(values: typeof trustedBrowserTable.$inferInsert) {
  const [record] = await db.insert(trustedBrowserTable).values(values).returning()
  return record
}

export async function seedTwoFactor({ userId, ...overrides }: SeedTwoFactorInput) {
  const plainSecret = overrides.secret ?? TEST_TOTP_SECRET
  const [record] = await db
    .insert(twoFactorTable)
    .values({
      userId,
      secret: overrides.encryptedSecret ?? encryptTOTPSecret(plainSecret),
      ...(overrides.createdAt && { createdAt: overrides.createdAt }),
      ...(overrides.lastUsedAt && { lastUsedAt: overrides.lastUsedAt }),
      ...(overrides.expiresAt && { expiresAt: overrides.expiresAt }),
    })
    .returning()

  return record
}

export async function seedTwoFactorBackupCodes(userId: number, count: number = 3) {
  const { codes, hashedCodes } = await generateBackupCodes(count)

  const rows = await db
    .insert(twoFactorBackupCodeTable)
    .values(hashedCodes.map((codeHash) => ({ userId, codeHash })))
    .returning()

  return {
    codes,
    hashedCodes,
    rows,
  }
}

export async function seedUser({ password = TEST_LOGIN_PASSWORD, passwordHash, ...overrides }: SeedUserInput = {}) {
  const unique = ++uniqueUserSequence

  const [user] = await db
    .insert(userTable)
    .values({
      ...(overrides.id !== undefined && { id: overrides.id }),
      loginId: overrides.loginId ?? `testuser${unique}`,
      name: overrides.name ?? `TestUser${unique}`,
      nickname: overrides.nickname ?? `Tester${unique}`,
      passwordHash: passwordHash ?? (await getTestPasswordHash(password)),
      ...(overrides.createdAt && { createdAt: overrides.createdAt }),
      ...(overrides.loginAt && { loginAt: overrides.loginAt }),
      ...(overrides.logoutAt && { logoutAt: overrides.logoutAt }),
      ...(overrides.imageURL !== undefined && { imageURL: overrides.imageURL }),
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
      ...(overrides.createdAt && { createdAt: overrides.createdAt }),
    })
    .returning()

  return record
}

export async function seedUserFollow({ followerId, followeeId, createdAt }: SeedUserFollowInput) {
  const [follow] = await db
    .insert(userFollowTable)
    .values({
      followerId,
      followeeId,
      ...(createdAt && { createdAt }),
    })
    .returning()

  return follow
}

export async function seedUserSettings({ userId, ...overrides }: SeedUserSettingsInput) {
  const [settings] = await db
    .insert(userSettingsTable)
    .values({
      userId,
      historySyncEnabled: overrides.historySyncEnabled ?? true,
      adultVerifiedAdVisible: overrides.adultVerifiedAdVisible ?? false,
      defaultCensorshipEnabled: overrides.defaultCensorshipEnabled ?? true,
      autoDeletionDay: overrides.autoDeletionDay ?? 90,
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
