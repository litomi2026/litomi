import { sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'

type Params = {
  loginId?: string
  name?: string
}

export default async function selectUser({ loginId, name }: Params) {
  if (name) {
    return db
      .select({
        id: userTable.id,
        createdAt: userTable.createdAt,
        nickname: userTable.nickname,
        imageURL: userTable.imageURL,
      })
      .from(userTable)
      .where(sql`${userTable.name} = ${name}`)
  }

  if (loginId) {
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

  throw new Error('Either loginId or name must be provided')
}
