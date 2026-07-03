import { db } from '@litomi/db/app'
import { userFollowTable, userTable } from '@litomi/db/app/user'
import { eq } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { cache } from 'react'

export type PublicUserProfile = {
  id: number
  name: string
  createdAt: string
  nickname: string
  imageURL: string | null
  followingCount: number
  followerCount: number
}

// TODO: cache component 도입하기
const getCachedPublicUserProfile = unstable_cache(
  async (name: string): Promise<PublicUserProfile | null> => {
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

    return user ? { ...user, createdAt: user.createdAt.toISOString() } : null
  },
  ['public-user-profile'],
  { revalidate: 60 },
)

export const getPublicUserProfile = cache(getCachedPublicUserProfile)
