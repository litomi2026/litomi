import { getUserIdFromCookie } from '@/utils/cookie'

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
      type: UserType.GUEST,
      name: '',
      nickname: '비회원',
      followingCount: 0,
      followerCount: 0,
      isFollowedByCurrentUser: false,
      isCurrentUser: false,
    }
  }

  const currentUserId = await getUserIdFromCookie()
  const existingUser = await getUserByName(username, currentUserId)

  if (!existingUser) {
    return {
      type: UserType.NOT_FOUND,
      name: username,
      nickname: '존재하지 않는 사용자',
      followingCount: 0,
      followerCount: 0,
      isFollowedByCurrentUser: false,
      isCurrentUser: false,
    }
  }

  return existingUser
}
