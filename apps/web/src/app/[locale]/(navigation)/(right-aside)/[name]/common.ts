import { db } from '@litomi/db/app'
import { userTable } from '@litomi/db/app/user'
import { eq } from 'drizzle-orm'
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
