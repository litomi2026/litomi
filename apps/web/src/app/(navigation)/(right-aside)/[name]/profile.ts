import { db } from '@litomi/db/app'
import { userFollowTable, userTable } from '@litomi/db/app/user'
import { eq } from 'drizzle-orm'
import { cache } from 'react'

export type PublicUserProfile = {
  id: number
  name: string
  createdAt: Date
  nickname: string
  imageURL: string | null
  followingCount: number
  followerCount: number
}

export const getPublicUserProfile = cache(async (name: string): Promise<PublicUserProfile | null> => {
  const [user] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      createdAt: userTable.createdAt,
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
      followingCount: db.$count(userFollowTable, eq(userFollowTable.followerId, userTable.id)),
      followerCount: db.$count(userFollowTable, eq(userFollowTable.followeeId, userTable.id)),
    })
    .from(userTable)
    .where(eq(userTable.name, name))

  return user ?? null
})
