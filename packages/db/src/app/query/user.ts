import { db } from '@litomi/db/app'
import { userTable } from '@litomi/db/app/user'
import { eq } from 'drizzle-orm'

type Params = {
  loginId?: string
  name?: string
}

export default async function selectUser({ loginId, name }: Params) {
  const condition = name ? eq(userTable.name, name) : loginId ? eq(userTable.loginId, loginId) : null

  if (!condition) {
    throw new Error('Either loginId or name must be provided')
  }

  return db
    .select({
      id: userTable.id,
      createdAt: userTable.createdAt,
      nickname: userTable.nickname,
      imageURL: userTable.imageURL,
    })
    .from(userTable)
    .where(condition)
}
