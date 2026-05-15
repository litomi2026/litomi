import { getUserIdFromCookie } from '@litomi/auth/cookie'

import { getUserByName } from './common'
import UserProfileView, { UserType } from './UserProfileView'

type Props = {
  username: string
}

export default async function UserProfile({ username }: Readonly<Props>) {
  const user = await resolveUser(username)
  return <UserProfileView user={user} />
}

async function resolveUser(username: string) {
  if (!username) {
    return {
      id: 0,
      name: '',
      nickname: '비회원',
      type: UserType.GUEST,
    }
  }

  const currentUserId = await getUserIdFromCookie()
  const existingUser = await getUserByName(username, currentUserId)

  if (!existingUser) {
    return {
      id: 0,
      name: username,
      nickname: '존재하지 않는 사용자',
      type: UserType.NOT_FOUND,
    }
  }

  return existingUser
}
