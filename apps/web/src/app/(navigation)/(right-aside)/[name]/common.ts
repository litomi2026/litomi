import { db } from '@litomi/db/database/app/drizzle'
import { userFollowTable, userTable } from '@litomi/db/database/app/user'
import { eq, or, sql } from 'drizzle-orm'
import { cache } from 'react'

export const getMe = cache(async (userId: number) => {
  const [user] = await db
    .select({
      id: userTable.id,
      loginId: userTable.loginId,
      name: userTable.name,
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))

  return user
})

export type Params = {
  name: string
}

export const getUserByName = cache(async (name: string, currentUserId?: number | null) => {
  const targetUserAlias = 'target_user'

  const targetUser = db
    .select({
      id: userTable.id,
      loginId: userTable.loginId,
      name: userTable.name,
      createdAt: userTable.createdAt,
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(eq(userTable.name, name))
    .as(targetUserAlias)

  const targetUserId = sql`${sql.identifier(targetUserAlias)}.${sql.identifier('id')}`

  const followStats = db
    .select({
      followingCount: sql<number>`
        count(*) filter (where ${userFollowTable.followerId} = ${targetUserId})::int
      `.as('following_count'),
      followerCount: sql<number>`
        count(*) filter (where ${userFollowTable.followeeId} = ${targetUserId})::int
      `.as('follower_count'),
      isFollowedByCurrentUser:
        currentUserId !== null && currentUserId !== undefined
          ? sql<boolean>`
              count(*) filter (
                where ${userFollowTable.followerId} = ${currentUserId}
                  and ${userFollowTable.followeeId} = ${targetUserId}
              ) > 0
            `.as('is_followed_by_current_user')
          : sql<boolean>`false`.as('is_followed_by_current_user'),
    })
    .from(userFollowTable)
    .where(or(eq(userFollowTable.followerId, targetUser.id), eq(userFollowTable.followeeId, targetUser.id)))
    .as('follow_stats')

  const [user] = await db
    .select({
      id: targetUser.id,
      loginId: targetUser.loginId,
      name: targetUser.name,
      createdAt: targetUser.createdAt,
      nickname: targetUser.nickname,
      imageURL: targetUser.imageURL,
      followingCount: followStats.followingCount,
      followerCount: followStats.followerCount,
      isFollowedByCurrentUser: followStats.isFollowedByCurrentUser,
    })
    .from(targetUser)
    .leftJoinLateral(followStats, sql`true`)

  return user
})
