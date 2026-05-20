import { db } from '@litomi/db/app'
import { userTable } from '@litomi/db/app/user'
import { sql } from 'drizzle-orm'

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
