import { sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'

type Params = {
  loginId: string
}

export default async function selectUser({ loginId }: Params) {
  return db
    .select({
      id: userTable.id,
      createdAt: userTable.createdAt,
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(sql`${userTable.loginId} = ${loginId}`)
}
