import { sql } from 'drizzle-orm'
import { cache } from 'react'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'

export const getUserById = cache(async (userId: string) => {
  const [user] = await db
    .select({
      loginId: userTable.loginId,
      name: userTable.name,
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(sql`${userTable.id} = ${userId}`)

  return user
})

export type Params = {
  name: string
}

export async function getUserByName(name: string) {
  if (!name) {
    return {
      type: 'guest',
      nickname: '비회원',
    }
  }

  const [dbUser] = await db
    .select({
      id: userTable.id,
      loginId: userTable.loginId,
      name: userTable.name,
      createdAt: userTable.createdAt,
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(sql`${userTable.name} = ${name}`)

  if (!dbUser) {
    return {
      type: 'not-found',
      name,
      nickname: '존재하지 않는 사용자',
    }
  }

  return dbUser
}
