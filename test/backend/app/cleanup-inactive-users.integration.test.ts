import { bookmarkTable } from '@litomi/db/database/app/activity'
import { authSessionFamilyTable } from '@litomi/db/database/app/auth'
import { db } from '@litomi/db/database/app/drizzle'
import { notificationTable } from '@litomi/db/database/app/notification'
import { NotificationType } from '@litomi/domain/database/enum'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { createRefreshSessionCookies } from '@test/backend/setup/auth'
import {
  readSessionFamiliesForUser,
  readUserById,
  readUserSettingsByUserId,
  seedBookmark,
  seedUser,
  seedUserSettings,
} from '@test/backend/setup/db'
import { describe, expect, test } from 'bun:test'
import { eq, sql } from 'drizzle-orm'

installBackendIntegrationHooks()

describe('cleanup_inactive_users()', () => {
  test('후보 조회 함수는 삭제 가능한 사용자만 오래된 순서대로 반환한다', async () => {
    const oldestUser = await seedUser({ loginAt: daysAgo(120) })
    const oldUser = await seedUser({ loginAt: daysAgo(75) })
    const protectedUser = await seedUser({ loginAt: daysAgo(45) })
    const disabledUser = await seedUser({ loginAt: daysAgo(120) })

    await Promise.all([
      seedUserSettings({ userId: oldestUser.id, autoDeletionDay: 30 }),
      seedUserSettings({ userId: oldUser.id, autoDeletionDay: 30 }),
      seedUserSettings({ userId: protectedUser.id, autoDeletionDay: 7 }),
      seedUserSettings({ userId: disabledUser.id, autoDeletionDay: 0 }),
    ])

    await createRefreshSessionCookies({ userId: protectedUser.id, deviceLabel: 'Still Valid Session' })
    await db
      .update(authSessionFamilyTable)
      .set({
        lastUsedAt: daysAgo(8),
        idleExpiresAt: daysFromNow(6),
        absoluteExpiresAt: daysFromNow(30),
      })
      .where(eq(authSessionFamilyTable.userId, protectedUser.id))

    const candidates = await readInactiveUserCleanupCandidates(10)

    expect(candidates.map((candidate) => Number(candidate.userId))).toEqual([oldestUser.id, oldUser.id])
    expect(candidates).toEqual([
      expect.objectContaining({
        userId: String(oldestUser.id),
        effectiveAutoDeletionDay: 30,
      }),
      expect.objectContaining({
        userId: String(oldUser.id),
        effectiveAutoDeletionDay: 30,
      }),
    ])
  })

  test('설정 기간이 지나도 30일 유예 안에서는 삭제하지 않는다', async () => {
    const user = await seedUser({ loginAt: daysAgo(45) })

    await seedUserSettings({ userId: user.id, autoDeletionDay: 30 })

    const deletedCount = await cleanupInactiveUsers()

    expect(deletedCount).toBe(0)
    expect(await readUserById(user.id)).not.toBeNull()
  })

  test('autoDeletionDay 기준으로 오래 비활성 상태인 사용자를 삭제하고 cascade를 적용한다', async () => {
    const user = await seedUser({ loginAt: daysAgo(75) })

    await seedUserSettings({ userId: user.id, autoDeletionDay: 30 })
    await seedBookmark(user.id, { mangaId: 1001 })
    await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Cleanup Test Device' })
    await db
      .update(authSessionFamilyTable)
      .set({
        lastUsedAt: daysAgo(75),
        idleExpiresAt: daysAgo(61),
        absoluteExpiresAt: daysAgo(61),
      })
      .where(eq(authSessionFamilyTable.userId, user.id))
    await db.insert(notificationTable).values({
      userId: user.id,
      type: NotificationType.TEST,
      title: 'cleanup',
      body: 'cleanup',
      sentAt: new Date(),
    })

    const deletedCount = await cleanupInactiveUsers()

    expect(deletedCount).toBe(1)
    expect(await readUserById(user.id)).toBeNull()
    expect(await readUserSettingsByUserId(user.id)).toBeNull()
    expect(await readSessionFamiliesForUser(user.id)).toHaveLength(0)
    expect(await db.select().from(bookmarkTable).where(eq(bookmarkTable.userId, user.id))).toHaveLength(0)
    expect(await db.select().from(notificationTable).where(eq(notificationTable.userId, user.id))).toHaveLength(0)
  })

  test('autoDeletionDay가 0이면 삭제하지 않는다', async () => {
    const user = await seedUser({ loginAt: daysAgo(90) })

    await seedUserSettings({ userId: user.id, autoDeletionDay: 0 })

    const deletedCount = await cleanupInactiveUsers()

    expect(deletedCount).toBe(0)
    expect(await readUserById(user.id)).not.toBeNull()
  })

  test('user_settings가 없어도 기본 autoDeletionDay로 삭제한다', async () => {
    const user = await seedUser({
      loginAt: daysAgo(125),
    })

    const deletedCount = await cleanupInactiveUsers()

    expect(deletedCount).toBe(1)
    expect(await readUserById(user.id)).toBeNull()
  })

  test('login_at이 null이면 created_at을 기준으로 삭제한다', async () => {
    const user = await seedUser({
      createdAt: daysAgo(125),
    })

    const deletedCount = await cleanupInactiveUsers()

    expect(deletedCount).toBe(1)
    expect(await readUserById(user.id)).toBeNull()
  })

  test('최근 로그인한 사용자는 생성일이 오래돼도 삭제하지 않는다', async () => {
    const user = await seedUser({
      createdAt: daysAgo(120),
      loginAt: daysAgo(5),
    })

    await seedUserSettings({ userId: user.id, autoDeletionDay: 30 })

    const deletedCount = await cleanupInactiveUsers()

    expect(deletedCount).toBe(0)
    expect(await readUserById(user.id)).not.toBeNull()
  })

  test('remember 세션이 최근에 사용된 사용자는 마지막 로그인 시각이 오래돼도 삭제하지 않는다', async () => {
    const user = await seedUser({
      createdAt: daysAgo(120),
      loginAt: daysAgo(75),
    })

    await seedUserSettings({ userId: user.id, autoDeletionDay: 30 })
    await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Remembered Session' })

    const deletedCount = await cleanupInactiveUsers()

    expect(deletedCount).toBe(0)
    expect(await readUserById(user.id)).not.toBeNull()
  })

  test('remember 세션은 실제 유효 만료 시각까지 보호한다', async () => {
    const user = await seedUser({
      createdAt: daysAgo(120),
      loginAt: daysAgo(45),
    })

    await seedUserSettings({ userId: user.id, autoDeletionDay: 7 })
    await createRefreshSessionCookies({ userId: user.id, deviceLabel: 'Protected Until Expiry' })
    await db
      .update(authSessionFamilyTable)
      .set({
        lastUsedAt: daysAgo(8),
        idleExpiresAt: daysFromNow(6),
        absoluteExpiresAt: daysFromNow(30),
      })
      .where(eq(authSessionFamilyTable.userId, user.id))

    const deletedCount = await cleanupInactiveUsers()

    expect(deletedCount).toBe(0)
    expect(await readUserById(user.id)).not.toBeNull()
  })

  test('batch_size만큼만 오래 비활성 상태인 사용자를 삭제한다', async () => {
    const oldestUser = await seedUser({ loginAt: daysAgo(120) })
    const olderUser = await seedUser({ loginAt: daysAgo(90) })
    const oldUser = await seedUser({ loginAt: daysAgo(75) })

    await Promise.all([
      seedUserSettings({ userId: oldestUser.id, autoDeletionDay: 30 }),
      seedUserSettings({ userId: olderUser.id, autoDeletionDay: 30 }),
      seedUserSettings({ userId: oldUser.id, autoDeletionDay: 30 }),
    ])

    const deletedCount = await cleanupInactiveUsers(2)

    expect(deletedCount).toBe(2)
    expect(await readUserById(oldestUser.id)).toBeNull()
    expect(await readUserById(olderUser.id)).toBeNull()
    expect(await readUserById(oldUser.id)).not.toBeNull()
  })
})

async function cleanupInactiveUsers(batchSize: number = 100) {
  const rows = (await db.execute(sql`select public.cleanup_inactive_users(${batchSize}) as deleted_count`)) as Array<{
    deleted_count: number
  }>

  return Number(rows[0]?.deleted_count ?? 0)
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

async function readInactiveUserCleanupCandidates(batchSize: number = 100) {
  return (await db.execute(sql`
    select
      candidate.user_id as "userId",
      candidate.effective_last_activity_at as "effectiveLastActivityAt",
      candidate.session_valid_until as "sessionValidUntil",
      candidate.effective_auto_deletion_day as "effectiveAutoDeletionDay"
    from public.get_inactive_user_cleanup_candidates(${batchSize}) as candidate
  `)) as Array<{
    userId: number | string
    effectiveLastActivityAt: Date
    sessionValidUntil: Date | null
    effectiveAutoDeletionDay: number
  }>
}
