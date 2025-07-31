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
