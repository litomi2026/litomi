import { getUserByName } from './common'
import UserProfileView from './UserProfileView'

type Props = {
  username: string
}

export default async function UserProfile({ username }: Readonly<Props>) {
  const user = await getUserByName(username)

  return <UserProfileView user={user} />
}
