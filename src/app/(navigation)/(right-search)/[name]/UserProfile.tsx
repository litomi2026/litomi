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
    }
  }

  const existingUser = await getUserByName(username)

  if (!existingUser) {
    return {
      type: UserType.NOT_FOUND,
      name: username,
      nickname: '존재하지 않는 사용자',
    }
  }

  return existingUser
}
