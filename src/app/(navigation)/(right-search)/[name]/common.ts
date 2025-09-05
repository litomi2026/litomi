import { eq } from 'drizzle-orm'
import { cache } from 'react'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'

export const getMe = cache(async (userId: number) => {
  const [user] = await db
    .select({
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

export const getUserByName = cache(async (name: string) => {
  const [user] = await db
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

  return user
})
