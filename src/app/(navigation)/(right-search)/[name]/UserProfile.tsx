import { sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { userTable } from '@/database/schema'

import UserProfileView from './UserProfileView'

type Props = {
  username: string
}

export default async function UserProfile({ username }: Readonly<Props>) {
  const user = await getUserByName(username)

  return <UserProfileView user={user} />
}

async function getUserByName(name: string) {
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
